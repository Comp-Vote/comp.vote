import Link from "next/link"; // Link routing
import { web3p } from "containers"; // Web3 provider
import { useRouter } from "next/router"; // Router
import { useState, useEffect } from "react"; // State management
import styles from "styles/layout.module.scss"; // Styles
import HamburgerMenu from "react-hamburger-menu"; // Hamburger button

export default function Header() {
  const router = useRouter(); // Router
  const [menuOpen, setMenuOpen] = useState(false); // Mobile menu
  const { address, authenticate, unauthenticate } = web3p.useContainer(); // State from context

  /**
   * Update menu state by checking window dimensions
   */
  const updateDimensions = () => {
    // If window width > 600px
    if (window.innerWidth > 600) {
      // Set menuOpen to false
      setMenuOpen(false);
    }
  };

  // componentDidMount
  useEffect(() => {
    // Update dimensions on first page load
    updateDimensions();
    // Add event listener to page resize
    window.addEventListener("resize", updateDimensions);

    // componentWillUnmount
    return () => {
      // Remove event listener from page resize
      window.removeEventListener("resize", updateDimensions);
    };
  }, []);

  return (
    <div className={styles.header}>
      {/* Center sizer */}
      <div>
        {/* Logo */}
        <div>
          <Link href="/">
            <a>
              <img
                src="brand/compound-logo.svg"
                alt="Compound logo"
                height="30"
                width="136"
              />
            </a>
          </Link>
        </div>

        {/* Menu */}
        <div>
          <ul>
            <li>
              <Link href="/">
                <a className={router.pathname === "/" ? styles.active : null}>
                  Vote
                </a>
              </Link>
            </li>
            <li>
              <Link href="/delegate">
                <a
                  className={
                    router.pathname === "/delegate" ? styles.active : null
                  }
                >
                  Delegate
                </a>
              </Link>
            </li>
          </ul>
        </div>

        {/* Authenticate button */}
        <div>
          {address ? (
            // If user is authenticated, show unauthenticate button
            <button onClick={unauthenticate}>
              {/* User address */}
              <span>
                {address.substr(0, 5) +
                  "..." +
                  address.slice(address.length - 5)}
              </span>
              {/* Logout icon SVG */}
              <svg viewBox="0 0 512 512">
                <path d="m320 277.335938c-11.796875 0-21.332031 9.558593-21.332031 21.332031v85.335937c0 11.753906-9.558594 21.332032-21.335938 21.332032h-64v-320c0-18.21875-11.605469-34.496094-29.054687-40.554688l-6.316406-2.113281h99.371093c11.777344 0 21.335938 9.578125 21.335938 21.335937v64c0 11.773438 9.535156 21.332032 21.332031 21.332032s21.332031-9.558594 21.332031-21.332032v-64c0-35.285156-28.714843-63.99999975-64-63.99999975h-229.332031c-.8125 0-1.492188.36328175-2.28125.46874975-1.027344-.085937-2.007812-.46874975-3.050781-.46874975-23.53125 0-42.667969 19.13281275-42.667969 42.66406275v384c0 18.21875 11.605469 34.496093 29.054688 40.554687l128.386718 42.796875c4.351563 1.34375 8.679688 1.984375 13.226563 1.984375 23.53125 0 42.664062-19.136718 42.664062-42.667968v-21.332032h64c35.285157 0 64-28.714844 64-64v-85.335937c0-11.773438-9.535156-21.332031-21.332031-21.332031zm0 0" />
                <path d="m505.75 198.253906-85.335938-85.332031c-6.097656-6.101563-15.273437-7.9375-23.25-4.632813-7.957031 3.308594-13.164062 11.09375-13.164062 19.714844v64h-85.332031c-11.777344 0-21.335938 9.554688-21.335938 21.332032 0 11.777343 9.558594 21.332031 21.335938 21.332031h85.332031v64c0 8.621093 5.207031 16.40625 13.164062 19.714843 7.976563 3.304688 17.152344 1.46875 23.25-4.628906l85.335938-85.335937c8.339844-8.339844 8.339844-21.824219 0-30.164063zm0 0" />
              </svg>
            </button>
          ) : (
            // Else, show authenticate button
            <button onClick={authenticate}>Connect Wallet</button>
          )}
        </div>

        {/* Mobile menu hamburger button */}
        <div className={styles.mobileButton}>
          <HamburgerMenu
            width={20}
            height={15}
            color="white"
            isOpen={menuOpen}
            menuClicked={() => setMenuOpen((previous) => !previous)}
          />
        </div>

        {/* Mobile menu */}
        <div
          className={`${styles.mobileMenu} ${
            menuOpen ? styles.mobileMenuOpen : styles.mobileMenuHidden
          }`}
        >
          <ul>
            <li>
              <Link href="/">
                <a>Vote</a>
              </Link>
            </li>
            <li>
              <Link href="/delegate">
                <a>Delegate</a>
              </Link>
            </li>
          </ul>
          {address ? (
            // If user is authenticated, show unauthenticate button
            <button
              onClick={() => {
                unauthenticate();
                setMenuOpen(false);
              }}
            >
              {/* User address */}
              <span>
                {address.substr(0, 5) +
                  "..." +
                  address.slice(address.length - 5)}
              </span>
              {/* Logout icon SVG */}
              <svg viewBox="0 0 512 512">
                <path d="m320 277.335938c-11.796875 0-21.332031 9.558593-21.332031 21.332031v85.335937c0 11.753906-9.558594 21.332032-21.335938 21.332032h-64v-320c0-18.21875-11.605469-34.496094-29.054687-40.554688l-6.316406-2.113281h99.371093c11.777344 0 21.335938 9.578125 21.335938 21.335937v64c0 11.773438 9.535156 21.332032 21.332031 21.332032s21.332031-9.558594 21.332031-21.332032v-64c0-35.285156-28.714843-63.99999975-64-63.99999975h-229.332031c-.8125 0-1.492188.36328175-2.28125.46874975-1.027344-.085937-2.007812-.46874975-3.050781-.46874975-23.53125 0-42.667969 19.13281275-42.667969 42.66406275v384c0 18.21875 11.605469 34.496093 29.054688 40.554687l128.386718 42.796875c4.351563 1.34375 8.679688 1.984375 13.226563 1.984375 23.53125 0 42.664062-19.136718 42.664062-42.667968v-21.332032h64c35.285157 0 64-28.714844 64-64v-85.335937c0-11.773438-9.535156-21.332031-21.332031-21.332031zm0 0" />
                <path d="m505.75 198.253906-85.335938-85.332031c-6.097656-6.101563-15.273437-7.9375-23.25-4.632813-7.957031 3.308594-13.164062 11.09375-13.164062 19.714844v64h-85.332031c-11.777344 0-21.335938 9.554688-21.335938 21.332032 0 11.777343 9.558594 21.332031 21.335938 21.332031h85.332031v64c0 8.621093 5.207031 16.40625 13.164062 19.714843 7.976563 3.304688 17.152344 1.46875 23.25-4.628906l85.335938-85.335937c8.339844-8.339844 8.339844-21.824219 0-30.164063zm0 0" />
              </svg>
            </button>
          ) : (
            // Else, show authenticate button
            <button
              onClick={() => {
                authenticate();
                setMenuOpen(false);
              }}
            >
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
