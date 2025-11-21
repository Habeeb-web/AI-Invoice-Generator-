import {useState,useEffect} from "react";
import {Link} from "react-router-dom";
import {FileText,Menu,X} from "lucide-react";
import ProfileDropdown from "../layout/ProfileDropdown";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";

const Header = () => {
  const[isScrolled,setIsScrolled]=useState(false);
  const[isMenuOpen,setIsMenuOpen]=useState(false);

  // ✅ Add logout to the destructuring
  const{isAuthenticated,user,logout}=useAuth();

  const [profileDropdownOpen,setProfileDropdownOpen]=useState(false);

  useEffect(()=>{
    const handleScroll=()=>{
      setIsScrolled(window.scrollY>10);
    };
    window.addEventListener("scroll",handleScroll);
    return ()=>window.removeEventListener("scroll",handleScroll);
  },[])
  
  return (
   <header
    className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      isScrolled ? "bg-white/95 backdrop-blur-sm shadow-lg" : "bg-transparent"
    }`}
    >
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-16 lg:h-20">
      <div className="flex items-center space-x-2">
        <div className="w-8 h-8 bg-blue-900 rounded-md flex items-center justify-center">
        <FileText className="w-4 h-4 text-white"/>
      </div>
      <span className="text-xl font-bold text-gray-900">
        AI Invoice App
      </span>
      </div>
      <div className="hidden lg:flex lg:items-center lg:space-x-8">
        <a
        href="#features"
        className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-black after:transition-all hover:after:w-full"
        >
          Features
        </a>
        <a 
        href="#testimonials"
        className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-black after:transition-all hover:after:w-full"
        >
          Testimonials
        </a>
        <a 
        href="#faq"
        className="text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-black after:transition-all hover:after:w-full"
        >
          FAQ
        </a>
        </div>
        <div className="hidden lg:flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              <Button 
                variant="primary"
                onClick={() => window.location.href = '/dashboard'}
              >
                Go to Dashboard
              </Button>
              <ProfileDropdown
                isOpen={profileDropdownOpen}
                onToggle={(e)=> {
                  e.stopPropagation();
                  setProfileDropdownOpen(!profileDropdownOpen);
                }}
                avatar={user?.avatar || ""}
                companyName={user?.name || ""}
                email={user?.email || ""}
                onLogout={logout} // ✅ Now this works!
              />
            </>
          ) : ( 
            <>
            <Link
          to="/login"
          className="text-black hover:text-gray-900 font-medium transition-colors duration-200"
          >
            Login
          </Link>
          <Button 
           variant="primary"
           onClick={() => window.location.href = '/SignUp'}
           >
            SignUp
           </Button></> )}
           </div>
           <div className="lg:hidden">
            <button
            onClick={()=> setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg text-gray-900 hover:bg-gray-100 transition-colors duration-200"
            >
              {isMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6"/>
              )}
              </button>
              </div>
              </div>

              {/* Mobile Menu */}
              {isMenuOpen && (
                <div className="lg:hidden bg-white border-t border-gray-200 py-4 px-4">
                  <div className="flex flex-col space-y-4">
                    <a
                      href="#features"
                      className="text-gray-600 hover:text-gray-900 font-medium py-2"
                    >
                      Features
                    </a>
                    <a 
                      href="#testimonials"
                      className="text-gray-600 hover:text-gray-900 font-medium py-2"
                    >
                      Testimonials
                    </a>
                    <a 
                      href="#faq"
                      className="text-gray-600 hover:text-gray-900 font-medium py-2"
                    >
                      FAQ
                    </a>
                    {isAuthenticated ? (
                      <div className="pt-4 border-t border-gray-200">
                        <Button 
                          variant="primary"
                          onClick={() => window.location.href = '/dashboard'}
                          className="w-full"
                        >
                          Go to Dashboard
                        </Button>
                      </div>
                    ) : (
                      <div className="pt-4 border-t border-gray-200 space-y-2">
                        <Link
                          to="/login"
                          className="block text-black hover:text-gray-900 font-medium py-2"
                        >
                          Login
                        </Link>
                        <Button 
                          variant="primary"
                          onClick={() => window.location.href = '/SignUp'}
                          className="w-full"
                        >
                          SignUp
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
              </div>
        </header>
  )
}

export default Header
