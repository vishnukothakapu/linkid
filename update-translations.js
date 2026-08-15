/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');

const en = JSON.parse(fs.readFileSync('./messages/en.json', 'utf8'));
const es = fs.existsSync('./messages/es.json') ? JSON.parse(fs.readFileSync('./messages/es.json', 'utf8')) : {};

// 1. Landing Page
en.Landing = {
  ...en.Landing,
  features: {
    ...(en.Landing && en.Landing.features),
    title: "Features",
    oneUsername: "One username across GitHub, LinkedIn, LeetCode, YouTube, and more",
    autoDetect: "Auto platform detection \u2014 paste any URL and the platform is identified instantly",
    realTime: "Real-time dashboard with instant add, edit, and delete",
    oauth: "OAuth login via Google & GitHub, plus email/password auth"
  }
};
es.Landing = {
  ...es.Landing,
  title: "Bienvenido a LinkID",
  description: "Tu único enlace para todo",
  cta: {
    ...(es.Landing && es.Landing.cta),
    title: "Tu identidad profesional, simplificada.",
    description: "Crea tu LinkID en menos de un minuto y comparte una URL memorable en todas partes.",
    button: "Empezar"
  },
  footer: {
    ...(es.Landing && es.Landing.footer),
    description: "Una identidad. Infinitos enlaces profesionales. Construido para desarrolladores que valoran URLs limpias y predecibles."
  },
  features: {
    ...(es.Landing && es.Landing.features),
    title: "Características",
    oneUsername: "Un nombre de usuario en GitHub, LinkedIn, LeetCode, YouTube y más",
    autoDetect: "Detección automática de plataforma \u2014 pega cualquier URL y la plataforma se identifica al instante",
    realTime: "Panel de control en tiempo real con adición, edición y eliminación instantáneas",
    oauth: "Inicio de sesión OAuth a través de Google y GitHub, además de autenticación por correo electrónico/contraseña"
  }
};

// 2. Dashboard
en.Dashboard = {
  ...en.Dashboard,
  AppearanceSection: { ...(en.Dashboard && en.Dashboard.AppearanceSection), title: "Appearance", description: "Customize your profile" },
  SeoSection: { ...(en.Dashboard && en.Dashboard.SeoSection), title: "SEO Settings", description: "Manage your search engine presence" },
  AnalyticsOverview: { ...(en.Dashboard && en.Dashboard.AnalyticsOverview), title: "Analytics", views: "Total Views", clicks: "Total Clicks" },
  LinkIdCard: { ...(en.Dashboard && en.Dashboard.LinkIdCard), title: "Your LinkID", share: "Share your LinkID" }
};
es.Dashboard = {
  ...es.Dashboard,
  title: "Panel",
  description: "Administra tu perfil",
  AppearanceSection: { ...(es.Dashboard && es.Dashboard.AppearanceSection), title: "Apariencia", description: "Personaliza tu perfil" },
  SeoSection: { ...(es.Dashboard && es.Dashboard.SeoSection), title: "Configuración de SEO", description: "Administra tu presencia en los motores de búsqueda" },
  AnalyticsOverview: { ...(es.Dashboard && es.Dashboard.AnalyticsOverview), title: "Analíticas", views: "Vistas Totales", clicks: "Clics Totales" },
  LinkIdCard: { ...(es.Dashboard && es.Dashboard.LinkIdCard), title: "Tu LinkID", share: "Comparte tu LinkID" }
};

// 3. PublicProfile
en.PublicProfile = {
  ...en.PublicProfile,
  EmptyProfileState: { ...(en.PublicProfile && en.PublicProfile.EmptyProfileState), title: "No links yet", description: "This profile has no public links." },
  ProfileFooter: { ...(en.PublicProfile && en.PublicProfile.ProfileFooter), createYourOwn: "Create your own LinkID" },
  ShareProfileButton: { ...(en.PublicProfile && en.PublicProfile.ShareProfileButton), share: "Share Profile", copy: "Copy Link", copied: "Copied!" },
  NewsletterSubscribeBlock: { ...(en.PublicProfile && en.PublicProfile.NewsletterSubscribeBlock), subscribe: "Subscribe", placeholder: "Your email", success: "Subscribed!" },
  ProfileCTA: { ...(en.PublicProfile && en.PublicProfile.ProfileCTA), getStarted: "Get Started for Free" },
  LockedLinkView: { ...(en.PublicProfile && en.PublicProfile.LockedLinkView), title: "Locked Link", description: "Enter pin to view", submit: "Unlock" },
  Preview: { ...(en.PublicProfile && en.PublicProfile.Preview), warning: "This is a preview. Links are disabled." }
};
es.PublicProfile = {
  ...es.PublicProfile,
  reportProfile: "Reportar Perfil",
  EmptyProfileState: { ...(es.PublicProfile && es.PublicProfile.EmptyProfileState), title: "Aún no hay enlaces", description: "Este perfil no tiene enlaces públicos." },
  ProfileFooter: { ...(es.PublicProfile && es.PublicProfile.ProfileFooter), createYourOwn: "Crea tu propio LinkID" },
  ShareProfileButton: { ...(es.PublicProfile && es.PublicProfile.ShareProfileButton), share: "Compartir Perfil", copy: "Copiar Enlace", copied: "¡Copiado!" },
  NewsletterSubscribeBlock: { ...(es.PublicProfile && es.PublicProfile.NewsletterSubscribeBlock), subscribe: "Suscribirse", placeholder: "Tu correo electrónico", success: "¡Suscrito!" },
  ProfileCTA: { ...(es.PublicProfile && es.PublicProfile.ProfileCTA), getStarted: "Empieza Gratis" },
  LockedLinkView: { ...(es.PublicProfile && es.PublicProfile.LockedLinkView), title: "Enlace Bloqueado", description: "Ingresa el PIN para ver", submit: "Desbloquear" },
  Preview: { ...(es.PublicProfile && es.PublicProfile.Preview), warning: "Esta es una vista previa. Los enlaces están desactivados." }
};

// 4. Static Pages
en.ContactUs = { ...en.ContactUs, title: "Contact Us", description: "Get in touch with our team" };
es.ContactUs = { ...es.ContactUs, title: "Contáctanos", description: "Ponte en contacto con nuestro equipo" };

en.About = { 
  ...en.About, 
  title: "About LinkID", 
  description: "Your professional identity, simplified.",
  badge: "About",
  whatIsTitle: "What is LinkID?",
  whatIsP1: "LinkID is a free, open-source link management platform built for developers and professionals. Instead of pasting long, forgettable URLs across every platform, you get one clean username and predictable links for every profile you own.",
  whatIsP2: "Share {github} or {linkedin} — and anyone who clicks it lands exactly where you want them, every time.",
  featuresTitle: "Features",
  f1: "One username across GitHub, LinkedIn, LeetCode, YouTube, and more",
  f2: "Auto platform detection — paste any URL and the platform is identified instantly",
  f3: "Real-time dashboard with instant add, edit, and delete",
  f4: "OAuth login via Google & GitHub, plus email/password auth",
  f5: "Public profile page shareable anywhere",
  f6: "Dark, light, and system theme support",
  f7: "Fully responsive, mobile-first design",
  openSourceTitle: "Open Source",
  openSourceP1: "LinkID is built entirely in the open under the {license}. Contributions, bug reports, and feature requests are always welcome.",
  github: "GitHub:",
  contributingGuide: "Contributing Guide:",
  contactTitle: "Get in Touch",
  contactP1: "Have questions, ideas, or want to contribute? Reach out through any of the following:",
  githubIssues: "GitHub Issues:",
  email: "Email:",
  githubDiscussions: "GitHub Discussions:",
  back: "Back to Home"
};
es.About = { 
  ...es.About, 
  title: "Acerca de LinkID", 
  description: "Tu identidad profesional, simplificada.",
  badge: "Acerca de",
  whatIsTitle: "¿Qué es LinkID?",
  whatIsP1: "LinkID es una plataforma gratuita y de código abierto para la gestión de enlaces creada para desarrolladores y profesionales. En lugar de pegar URL largas y fáciles de olvidar en todas las plataformas, obtienes un nombre de usuario limpio y enlaces predecibles para cada perfil que poseas.",
  whatIsP2: "Comparte {github} o {linkedin}, y cualquiera que haga clic en él llegará exactamente donde tú quieras, en todo momento.",
  featuresTitle: "Características",
  f1: "Un nombre de usuario en GitHub, LinkedIn, LeetCode, YouTube y más",
  f2: "Detección automática de plataforma: pega cualquier URL y la plataforma se identifica al instante",
  f3: "Panel de control en tiempo real con adición, edición y eliminación instantáneas",
  f4: "Inicio de sesión OAuth a través de Google y GitHub, además de autenticación por correo electrónico/contraseña",
  f5: "Página de perfil público que se puede compartir en cualquier lugar",
  f6: "Soporte para temas oscuros, claros y del sistema",
  f7: "Diseño totalmente responsivo, centrado en dispositivos móviles",
  openSourceTitle: "Código Abierto",
  openSourceP1: "LinkID está construido íntegramente de forma abierta bajo la {license}. Las contribuciones, informes de errores y solicitudes de funciones son siempre bienvenidos.",
  github: "GitHub:",
  contributingGuide: "Guía de Contribución:",
  contactTitle: "Ponerse en Contacto",
  contactP1: "¿Tienes preguntas, ideas o quieres contribuir? Comunícate a través de cualquiera de los siguientes medios:",
  githubIssues: "Problemas de GitHub:",
  email: "Correo Electrónico:",
  githubDiscussions: "Discusiones de GitHub:",
  back: "Volver al Inicio"
};

en.Privacy = { ...en.Privacy, title: "Privacy Policy", description: "How we handle your data." };
es.Privacy = { ...es.Privacy, title: "Política de Privacidad", description: "Cómo manejamos tus datos." };

en.Terms = { ...en.Terms, title: "Terms of Service", description: "Rules for using LinkID." };
es.Terms = { ...es.Terms, title: "Términos de Servicio", description: "Reglas para usar LinkID." };

en.NotFound = { ...en.NotFound, title: "Page Not Found", description: "The page you are looking for does not exist." };
es.NotFound = { ...es.NotFound, title: "Página No Encontrada", description: "La página que buscas no existe." };

es.Common = {
  ...es.Common,
  language: "Idioma",
  english: "Inglés",
  spanish: "Español"
};

fs.writeFileSync('./messages/en.json', JSON.stringify(en, null, 2));
fs.writeFileSync('./messages/es.json', JSON.stringify(es, null, 2));
console.log('Translations updated successfully.');
