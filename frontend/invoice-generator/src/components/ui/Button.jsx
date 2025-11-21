import { Loader2 } from "lucide-react"

const Button = ({
    variant = 'primary',
    size = 'medium',
    isLoading = false,
    children,
    icon: Icon,
    ...props
}) => {

    const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
    
    const variantClasses = {
        primary: 'bg-blue-900 hover:bg-blue-800 text-white',
        secondary: 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-700',
    };

    const sizeClasses = {
        small: 'px-3 py-2 text-sm',
        medium: 'px-4 py-2.5 text-sm',
        large: 'px-6 py-3 text-base',
    };

    return (
        <button
            className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
            disabled={isLoading}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
                <>
                    {Icon && <Icon className="w-4 h-4 mr-2" />}
                    {children}
                </>
            )}
        </button>
    )
}

export default Button