import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-white font-bold text-lg mb-4">ummah Directory</h3>
            <p className="text-sm">
              Connecting the Muslim community with trusted businesses, mosques, charities, and services.
            </p>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Quick Links</h4>
            <div className="space-y-2 text-sm">
              <Link to="/businesses" className="block hover:text-white">Businesses</Link>
              <Link to="/mosques" className="block hover:text-white">Mosques</Link>
              <Link to="/charities" className="block hover:text-white">Charities</Link>
              <Link to="/events" className="block hover:text-white">Events</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">Support</h4>
            <div className="space-y-2 text-sm">
              <Link to="/page/about" className="block hover:text-white">About Us</Link>
              <Link to="/page/contact" className="block hover:text-white">Contact</Link>
              <Link to="/page/faq" className="block hover:text-white">FAQ</Link>
              <Link to="/privacy" className="block hover:text-white">Privacy Policy</Link>
              <Link to="/terms" className="block hover:text-white">Terms of Service</Link>
            </div>
          </div>
          <div>
            <h4 className="text-white font-medium mb-4">For Businesses</h4>
            <div className="space-y-2 text-sm">
              <Link to="/register" className="block hover:text-white">Create Account</Link>
              <Link to="/businesses/submit" className="block hover:text-white">Add Listing</Link>
              <Link to="/page/premier" className="block hover:text-white">Premier Listings</Link>
              <Link to="/page/advertise" className="block hover:text-white">Advertise</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-8 pt-8 text-sm text-center">
          &copy; {new Date().getFullYear()} ummah Directory. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
