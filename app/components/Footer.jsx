import Image from 'next/image'
import React from 'react'

const Footer = () => {
  return (
    <footer className='w-screen h-auto lg:h-[30vh] bg-neutral-900 bg-[url("/service-bg.png")] bg-cover text-[#ededed]'>
      <div className="w-full flex flex-col lg:flex-row justify-between p-10">
        <div className="lg:max-w-[20vw]">
          <h1 className="text-6xl font-semibold text-wrap">
            Dental Care <span className="font-light">&reg;</span>
          </h1>
          <p className="text-sm mt-4">Creating One smile at a time!!</p>
        </div>
        <div className="invisible lg:visible flex flex-col justify-center items-center">
          <p>Developed by</p>
          <h1 className="font-sans font-extrabold text-5xl tracking-tight">
            techKraft
          </h1>
          {/* <Image src='/logo-white.png' width={100} height={100} alt='techKraft' /> */}
        </div>
        <div className="p-3 flex flex-col gap-3 mr-5 font-light justify-center">
          <p>Home</p>
          <p>About</p>
          <p>Treatments</p>
          <p>Testiimonials</p>
        </div>
        <div className="flex lg:hidden mt-4 flex-col justify-center items-center">
          <p>Developed by</p>
          <h1 className="font-sans font-extrabold text-5xl tracking-tight">
            techKraft
          </h1>
          {/* <Image src='/logo-white.png' width={100} height={100} alt='techKraft' /> */}
        </div>
      </div>
    </footer>
  );
}

export default Footer