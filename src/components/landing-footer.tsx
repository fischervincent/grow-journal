import Link from "next/link"

export default function LandingFooter() {
  return (
    <footer className="bg-gray-50 border-t py-8">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <span className="text-lg font-bold text-green-600">PlantCare</span>
            <p className="text-sm text-gray-600 mt-1">Keep your plants thriving</p>
          </div>
          <div className="flex gap-6 text-sm">
            <Link href="#" className="text-gray-600 hover:text-green-600">
              Privacy Policy
            </Link>
            <Link href="#" className="text-gray-600 hover:text-green-600">
              Terms of Service
            </Link>
            <Link href="#" className="text-gray-600 hover:text-green-600">
              Contact
            </Link>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} PlantCare. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
