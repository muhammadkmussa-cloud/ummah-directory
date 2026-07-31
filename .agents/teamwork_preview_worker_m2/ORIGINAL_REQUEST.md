## 2026-07-30T18:02:28Z
Objective: Implement frontend type safety fixes and setup ESLint v9 configuration in `frontend/`.
Working Directory: /home/muhammad-mussa/projects/ummah-directory/.agents/teamwork_preview_worker_m2
Project Root: /home/muhammad-mussa/projects/ummah-directory/frontend

Explorer Handoff Report Location:
/home/muhammad-mussa/projects/ummah-directory/.agents/teamwork_preview_explorer_m2/handoff.md

Tasks to execute:
1. Update `frontend/src/components/ui/Button.tsx`:
   - Add size `'xs'` to `ButtonProps` interface: `size?: 'xs' | 'sm' | 'md' | 'lg' | 'icon'`.
   - Add class styling `'px-2.5 py-1 text-xs': size === 'xs'` in `cn(...)`.

2. Update `frontend/src/features/organizations/OrganizationEditSheet.tsx`:
   - Update `OrganizationEditSheetProps` to set `queryKey?: (string | undefined)[]`.

3. Update `frontend/src/components/ui/ImageUploader.tsx`:
   - Add `currentUrl?: string | null` and `onUploaded?: (url: string) => void` to `ImageUploaderProps`.
   - Update `ImageUploader` component implementation to accept `currentUrl` and `onUploaded` and trigger `if (onUploaded) onUploaded(...)` on upload success.

4. Install devDependencies for ESLint v9:
   - Run `npm install -D typescript-eslint eslint-plugin-react-hooks eslint-plugin-react-refresh globals` in `frontend/`.

5. Create `frontend/eslint.config.js`:
   - Create flat configuration for ESLint v9 supporting React + TypeScript.

6. Verification:
   - Run `npm run typecheck` in `frontend/` and confirm 0 errors.
   - Run `npm run lint` in `frontend/` and confirm ESLint executes flat config successfully.
