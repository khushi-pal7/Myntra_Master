import React, {Fragment} from 'react'
import { Link } from 'react-router-dom'

const sidebar = () => {
  return (
    <Fragment>
        <div className=''>
         <ul>
           <li className='text-sm py-6 border-b-[1px] mr-6 text-slate-500 hover:text-[#e6355f] cursor-pointer'>
             <Link to="/dashboard">OVERVIEW</Link>
           </li>

           <h1 className='text-slate-400 text-sm pt-6'>ORDERS</h1>
           <li className='text-sm pb-6 pt-3 border-b-[1px] mr-6 text-slate-500 hover:text-[#e6355f] cursor-pointer'>Orders & Returns</li>

           <h1 className='text-slate-400 text-sm pt-6'>ACCOUNT</h1>
           <li className='text-sm pt-3 mr-6 text-slate-500 hover:text-[#e6355f] cursor-pointer'>
             <Link to="/dashboard">Profile</Link>
           </li>
           <li className='text-sm pt-3 mr-6 text-[#e6355f] font-bold cursor-pointer'>
             <Link to="/dashboard/fit-profile">My Fit Profile ✨</Link>
           </li>
           <li className='text-sm pt-3 mr-6 text-slate-500 hover:text-[#e6355f] cursor-pointer'>Saves Cards</li>
           <li className='text-sm mr-6 text-slate-500 hover:text-[#e6355f] cursor-pointer'>Addresses</li>
           <li className='text-sm pb-6 border-b-[1px] mr-6 text-slate-500 hover:text-[#e6355f] cursor-pointer'>Myntra Insider</li>

           <h1 className='text-slate-400 text-sm pt-6'>INFORMATION</h1>
           <li className='text-sm pt-3 mr-6 text-slate-500 hover:text-[#e6355f] cursor-pointer'>Terms of Use</li>
           <li className='text-sm pb-6 border-b-[1px] mr-6 text-slate-500 hover:text-[#e6355f] cursor-pointer'>Privacy Policy</li>

         </ul>
        </div>
    </Fragment>
  )
}

export default sidebar