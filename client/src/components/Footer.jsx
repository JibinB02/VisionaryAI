import { Link } from "react-router-dom";
import { assets } from "../assets/assets";

const Footer = () => {
  return (
    <div className="flex items-center justify-between gap-4 py-3 mt-20">
      <div className="flex items-center gap-3 px-4 py-2">
        <Link to="/">
          <img
            src={assets.logo_icon}
            alt="VisionaryAI Logo"
            className="w-10 h-10 object-contain"
          />
        </Link>
        <p className="text-xl font-extrabold text-gray-800 tracking-wide">
          Visionary<span className="text-green-500">AI</span>
        </p>
      </div>
      <p className="flex-1 border-l border-gray-400 pl-4 text-sm text-gray-500 max-sm:hidden">
        Copyright @Jibin.dev | All right reserved.
      </p>
      <div className="flex gap-2.5">
        <img src={assets.facebook_icon} alt="" width={35} />
        <img src={assets.twitter_icon} alt="" width={35} />
        <img src={assets.instagram_icon} alt="" width={35} />
      </div>
    </div>
  );
};

export default Footer;
