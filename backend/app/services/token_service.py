from datetime import timedelta

import structlog

from app.core.cache import get_redis

logger = structlog.get_logger()


async def blacklist_token(jti: str, expires_in: timedelta) -> None:
    """
    Add a token JTI to the blacklist for the specified duration.
    
    Args:
        jti: JWT Token ID to blacklist
        expires_in: Time duration until the token naturally expires
    """
    try:
        r = await get_redis()
        await r.set(f"token_blacklist:{jti}", "revoked", ex=int(expires_in.total_seconds()))
    except Exception:
        # Fail open for availability: if Redis is unavailable we cannot record
        # the revocation, so the token remains valid until it expires. The short
        # access-token TTL (default 15 minutes) bounds that exposure. We log the
        # failure so it can be alerted on rather than failing silently.
        logger.warning("token.blacklist_failed", jti=jti)


async def is_token_blacklisted(jti: str) -> bool:
    """
    Check if a token JTI is blacklisted.
    
    Args:
        jti: JWT Token ID to check
        
    Returns:
        True if token is blacklisted, False otherwise
    """
    try:
        r = await get_redis()
        return await r.exists(f"token_blacklist:{jti}") == 1
    except Exception:
        # Same availability trade-off as blacklist_token: assume not revoked so
        # a transient Redis outage does not lock out every user.
        logger.warning("token.blacklist_check_failed", jti=jti)
        return False


async def revoke_session(user_id: str, jti: str) -> bool:
    """
    Revoke a specific session by removing it from active sessions and blacklisting the token.
    
    Args:
        user_id: ID of the user whose session to revoke
        jti: JWT Token ID of the session to revoke
        
    Returns:
        True if session was found and revoked, False otherwise
    """
    try:
        r = await get_redis()
        sessions_key = f"active_sessions:{user_id}"
        
        # Remove from active sessions list
        removed = False
        for entry in await r.lrange(sessions_key, 0, -1):
            if isinstance(entry, bytes):
                entry = entry.decode("utf-8")
            if jti in entry:
                await r.lrem(sessions_key, 0, entry)
                removed = True
                break
        
        # Also blacklist the token
        if removed:
            # Get expiration from existing session or use default
            await blacklist_token(jti, timedelta(days=7))
            logger.info("token.session_revoked", user_id=user_id, jti=jti)
            return True
        
        return False
    except Exception as e:
        logger.error("token.revoke_session_failed", user_id=user_id, jti=jti, error=str(e))
        return False


async def logout_all_sessions(user_id: str) -> int:
    """
    Logout all active sessions for a user by blacklisting all their tokens.
    
    Args:
        user_id: ID of the user whose sessions to terminate
        
    Returns:
        Number of sessions terminated
    """
    try:
        r = await get_redis()
        sessions_key = f"active_sessions:{user_id}"
        
        # Get all active sessions
        sessions = await r.lrange(sessions_key, 0, -1)
        count = len(sessions)
        
        if count == 0:
            return 0
        
        # Blacklist all tokens and clear the session list
        for entry in sessions:
            if isinstance(entry, bytes):
                entry = entry.decode("utf-8")
            
            # Extract JTI from session data
            import json
            try:
                session_data = json.loads(entry)
                jti = session_data.get("jti", entry)
            except (json.JSONDecodeError, TypeError):
                jti = entry
            
            # Blacklist each token
            await blacklist_token(str(jti), timedelta(days=7))
        
        # Clear all sessions for this user
        await r.delete(sessions_key)
        
        logger.info("token.all_sessions_revoked", user_id=user_id, sessions_count=count)
        return count
    except Exception as e:
        logger.error("token.logout_all_sessions_failed", user_id=user_id, error=str(e))
        return 0


async def get_active_sessions(user_id: str) -> list[dict]:
    """
    Get all active sessions for a user.
    
    Args:
        user_id: ID of the user
        
    Returns:
        List of active session metadata
    """
    try:
        r = await get_redis()
        sessions_key = f"active_sessions:{user_id}"
        sessions = []
        
        import json
        for entry in await r.lrange(sessions_key, 0, -1):
            if isinstance(entry, bytes):
                entry = entry.decode("utf-8")
            
            try:
                session_data = json.loads(entry)
                if isinstance(session_data, dict):
                    # Remove sensitive data before returning
                    safe_session = {
                        "jti": session_data.get("jti", ""),
                        "created_at": session_data.get("created_at", ""),
                        "ip_address": session_data.get("ip_address", ""),
                        "user_agent": session_data.get("user_agent", ""),
                    }
                    sessions.append(safe_session)
            except (json.JSONDecodeError, TypeError):
                # Legacy format - just store as string
                sessions.append({"jti": str(entry)})
        
        return sessions
    except Exception as e:
        logger.error("token.get_active_sessions_failed", user_id=user_id, error=str(e))
        return []
