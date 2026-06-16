export function initMobileNav() {
  const nav = document.querySelector(".top-nav");
  const button = document.querySelector(".menu-button");
  if (!nav || !button) return;

  button.setAttribute("aria-expanded", "false");

  button.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("menu-open");
    button.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("menu-open");
      button.setAttribute("aria-expanded", "false");
    });
  });
}
