import logo from "../assets/logoRZ.png";
import { FaFilePdf, FaLinkedin, FaGithub, FaInstagram } from "react-icons/fa6";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between py-6">
      <div className="flex flex-shrink-0 items-center">
        <img className="mx-2 w-20" src={logo} alt="logo" />
      </div>
      <div className="m-8 flex items-center justify-center gap-4 text-2xl">
        {/* Resume Download Button (Google Drive Direct Download) */}
        <a href="https://docs.google.com/document/d/1PON1E6uv-rMAfIrXJ8CFHTz5B-M8IMhQorJZckXIbcw/edit?usp=sharing" target="_blank" rel="noopener noreferrer">
          <FaFilePdf className="hover:text-red-600 transition duration-300" />
        </a>
        <a href="https://www.linkedin.com/in/rugved-zarkar-96878b2a4" target="_blank" rel="noopener noreferrer">
          <FaLinkedin className="hover:text-blue-600 transition duration-300" />
        </a>
        <a href="https://github.com/rzarka1298" target="_blank" rel="noopener noreferrer">
          <FaGithub className="hover:text-gray-700 transition duration-300" />
        </a>
        <a href="https://www.instagram.com/rugvedzarkar" target="_blank" rel="noopener noreferrer">
          <FaInstagram className="hover:text-pink-500 transition duration-300" />
        </a>
      </div>
    </nav>
  );
};

export default Navbar;