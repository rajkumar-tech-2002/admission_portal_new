/**
 * Clears all browser cookies by iterating through them and setting expiry to the past.
 */
export const clearAllCookies = () => {
    const cookies = document.cookie.split(";");

    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        // Also try clearing with domain if needed
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
    }
};

/**
 * Securely logs out the user by clearing all storage and cookies, then redirecting to login.
 * @param {Function} navigate - The navigate function from react-router-dom
 */
export const secureLogout = (navigate) => {
    // 1. Clear session storage (Primary token location)
    sessionStorage.clear();
    
    // 2. Clear local storage (Redundancy/Other data)
    localStorage.clear();
    
    // 3. Clear all cookies
    clearAllCookies();
    
    // 4. Redirect to login page
    // Using replace: true prevents the user from using the back button to return to the protected page
    if (navigate) {
        navigate('/login', { replace: true });
    } else {
        window.location.href = '/login';
    }
};
