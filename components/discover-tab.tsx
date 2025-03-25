"use client"

import Image from "next/image"

export default function DiscoverTab() {
  return (
    <div className="discover-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-5 h-full overflow-y-auto">
      <div className="discover-card bg-white dark:bg-paper-dark rounded-lg overflow-hidden shadow-sm border border-paper-dark dark:border-paper">
        <Image
          src="https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
          alt="Historical Fiction"
          width={400}
          height={225}
          className="discover-image w-full h-[120px] object-cover"
        />
        <div className="discover-info p-3">
          <h3 className="discover-title text-base font-bold mb-1 text-highlight dark:text-highlight">
            Historical Fiction
          </h3>
          <p className="discover-author text-sm text-ink-light dark:text-ink-light">125 stories</p>
        </div>
      </div>

      <div className="discover-card bg-white dark:bg-paper-dark rounded-lg overflow-hidden shadow-sm border border-paper-dark dark:border-paper">
        <Image
          src="https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
          alt="Science Fiction"
          width={400}
          height={225}
          className="discover-image w-full h-[120px] object-cover"
        />
        <div className="discover-info p-3">
          <h3 className="discover-title text-base font-bold mb-1 text-highlight dark:text-highlight">Sci-Fi Shorts</h3>
          <p className="discover-author text-sm text-ink-light dark:text-ink-light">89 stories</p>
        </div>
      </div>

      <div className="discover-card bg-white dark:bg-paper-dark rounded-lg overflow-hidden shadow-sm border border-paper-dark dark:border-paper">
        <Image
          src="https://images.unsplash.com/photo-1510172951991-856a62a9e395?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
          alt="Poetry"
          width={400}
          height={225}
          className="discover-image w-full h-[120px] object-cover"
        />
        <div className="discover-info p-3">
          <h3 className="discover-title text-base font-bold mb-1 text-highlight dark:text-highlight">Modern Poetry</h3>
          <p className="discover-author text-sm text-ink-light dark:text-ink-light">64 collections</p>
        </div>
      </div>

      <div className="discover-card bg-white dark:bg-paper-dark rounded-lg overflow-hidden shadow-sm border border-paper-dark dark:border-paper">
        <Image
          src="https://images.unsplash.com/photo-1455390582262-044cdead277a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
          alt="Essays"
          width={400}
          height={225}
          className="discover-image w-full h-[120px] object-cover"
        />
        <div className="discover-info p-3">
          <h3 className="discover-title text-base font-bold mb-1 text-highlight dark:text-highlight">Thought Essays</h3>
          <p className="discover-author text-sm text-ink-light dark:text-ink-light">42 essays</p>
        </div>
      </div>

      <div className="discover-card bg-white dark:bg-paper-dark rounded-lg overflow-hidden shadow-sm border border-paper-dark dark:border-paper">
        <Image
          src="https://images.unsplash.com/photo-1535905557558-afc4877a26fc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
          alt="Horror"
          width={400}
          height={225}
          className="discover-image w-full h-[120px] object-cover"
        />
        <div className="discover-info p-3">
          <h3 className="discover-title text-base font-bold mb-1 text-highlight dark:text-highlight">Micro Horror</h3>
          <p className="discover-author text-sm text-ink-light dark:text-ink-light">57 stories</p>
        </div>
      </div>

      <div className="discover-card bg-white dark:bg-paper-dark rounded-lg overflow-hidden shadow-sm border border-paper-dark dark:border-paper">
        <Image
          src="https://images.unsplash.com/photo-1513151233558-d860c5398176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
          alt="Romance"
          width={400}
          height={225}
          className="discover-image w-full h-[120px] object-cover"
        />
        <div className="discover-info p-3">
          <h3 className="discover-title text-base font-bold mb-1 text-highlight dark:text-highlight">Quick Romance</h3>
          <p className="discover-author text-sm text-ink-light dark:text-ink-light">93 stories</p>
        </div>
      </div>
    </div>
  )
}

