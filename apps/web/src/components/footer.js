export function Footer() {
    return (
      <footer className="py-8 px-4 sm:px-6 lg:px-8 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">© {new Date().getFullYear()}. All rights reserved | Terms of use</p>
            <p className="text-gray-400">Designed by Cosmos Creators</p>
          </div>
        </div>
      </footer>
    )
  }
  