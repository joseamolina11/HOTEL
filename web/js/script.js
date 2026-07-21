/* =============================================
   HOTEL LUXURY — Landing Page JavaScript
   Menú móvil, scroll, animaciones, contadores,
   formulario de reserva, FAQ, back-to-top,
   i18n (ES/EN), moneda (COP/USD), WhatsApp
   ============================================= */

/* ---------- Splash ---------- */
document.body.style.overflow = 'hidden';
window.addEventListener('load', () => {
  const splash = document.getElementById('splash');
  if (!splash) return;
  setTimeout(() => {
    splash.classList.add('open');
    setTimeout(() => {
      splash.style.display = 'none';
      document.body.style.overflow = '';
    }, 700);
  }, 2000);
});

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- i18n Translations ---------- */
  const EXCHANGE_RATE = 3500;

  const i18n = {
    es: {
      'page-title':      'Hotel Luxury Fundación | Hotel 5 Estrellas en Fundación, Magdalena',
      'nav-about':       'El Hotel',
      'nav-rooms':       'Habitaciones',
      'nav-services':    'Servicios',
      'nav-gallery':     'Galería',
      'nav-contact':     'Contacto',
      'nav-book':        'Reservar',
      'nav-faq':         'FAQ',
      'hero-badge':      'Hotel 5 Estrellas',
      'hero-title':      'Donde el lujo encuentra su hogar',
      'hero-sub':        'Disfrute de una experiencia inolvidable en Fundación, Magdalena, con vistas panorámicas, gastronomía de clase mundial y el confort que usted merece.',
      'hero-book':       'Reservar ahora',
      'hero-rooms':      'Ver habitaciones',
      'hero-scroll':     'Descubrir',
      'qb-checkin':      'Entrada',
      'qb-checkout':     'Salida',
      'qb-adults':       'Adultos',
      'qb-children':     'Niños',
      'qb-room':         'Habitación',
      'qb-book':         'Reservar',
      'room1':           'Suite Royal Horizon',
      'room2':           'Executive Gold',
      'room3':           'Sky Luxury Suite',
      'about-title':     'El Arte de la Hospitalidad en Fundación',
      'about-p1':        'Ubicado en el corazón de Fundación, Magdalena, Hotel Luxury Fundación es el destino perfecto para quienes buscan una experiencia de lujo en la costa Caribe colombiana. Cada detalle está cuidadosamente pensado para superar sus expectativas.',
      'about-p2':        'Disfrute de instalaciones de primer nivel, un equipo humano excepcional y una ubicación privilegiada cerca de los principales atractivos del Magdalena, que convierte cada visita en un recuerdo imborrable.',
      'about-spa':       'Spa & Bienestar',
      'about-rest':      'Restaurante Gourmet',
      'about-view':      'Vista Panorámica',
      'about-service':   'Atención Personalizada',
      'rooms-title':     'Habitaciones Premium',
      'rooms-sub':       'Cada una de nuestras suites ha sido diseñada para brindarle una experiencia única de confort y elegancia.',
      'rooms-badge1':    'Más popular',
      'rooms-badge2':    'Exclusiva',
      'rooms-desc1':     'Amplia suite con terraza privada y vista al mar. Acabados en mármol y textiles italianos.',
      'rooms-desc2':     'Suite ejecutiva con área de trabajo, sala de estar independiente y acceso a lounge exclusivo.',
      'rooms-desc3':     'Penthouse de lujo con piscina privada, terraza panorámica y mayordomo personal 24/7.',
      'rooms-guests1':   '2 huéspedes',
      'rooms-guests2':   '3 huéspedes',
      'rooms-guests3':   '4 huéspedes',
      'rooms-view1':     'Mar',
      'rooms-view2':     'Ciudad',
      'rooms-view3':     'Panorámica',
      'rooms-book':      'Reservar ahora',
      'per-night':       '/ noche',
      'services-title':  'Servicios Premium',
      'services-sub':    'Todo lo que necesita para una estancia perfecta, a su disposición.',
      'sv-wifi':         'WiFi Premium',
      'sv-wifi-d':       'Conexión de alta velocidad en todas las instalaciones',
      'sv-spa':          'Spa & Wellness',
      'sv-spa-d':        'Masajes, sauna, jacuzzi y tratamientos de belleza',
      'sv-rest':         'Restaurante Gourmet',
      'sv-rest-d':       'Cocina de autor con ingredientes locales y temporada',
      'sv-bar':          'Bar & Lounge',
      'sv-bar-d':        'Cócteles de autor y música en vivo',
      'sv-gym':          'Gimnasio',
      'sv-gym-d':        'Equipamiento Technogym de última generación',
      'sv-room':         'Room Service 24h',
      'sv-room-d':       'Menú completo disponible a cualquier hora',
      'sv-laundry':      'Lavandería',
      'sv-laundry-d':    'Servicio de lavado y planchado exprés',
      'sv-parking':      'Estacionamiento',
      'sv-parking-d':    'Estacionamiento cubierto con vigilancia 24h',
      'sv-transport':    'Traslado Aeropuerto',
      'sv-transport-d':  'Vehículos de lujo con chofer privado',
      'sv-concierge':    'Conserjería',
      'sv-concierge-d':  'Asistencia personalizada para tours y eventos',
      'sv-business':     'Business Center',
      'sv-business-d':   'Sala de juntas y oficinas equipadas',
      'sv-checkin':      'Check-in Exprés',
      'sv-checkin-d':    'Proceso de llegada ágil y sin complicaciones',
      'gallery-title':   'Galería',
      'gallery-sub':     'Descubra cada rincón de nuestro hotel a través de estas imágenes.',
      'stats-title':     'Nuestros Números',
      'stats-sub':       'El respaldo de quienes nos eligen.',
      'stat1':           'Años de experiencia',
      'stat2':           'Huéspedes satisfechos',
      'stat3':           'Calificación (4.9 ★)',
      'stat4':           '% Satisfacción',
      'test-title':      'Lo Que Dicen Nuestros Huéspedes',
      'test-sub':        'Experiencias reales de quienes ya vivieron el lujo.',
      'test-t1':         '"Una experiencia inolvidable. El servicio es impecable, las instalaciones son de primer nivel y la atención al detalle es extraordinaria."',
      'test-t2':         '"El mejor hotel en el que me he hospedado. La Suite Royal Horizon superó todas mis expectativas. El personal es muy atento."',
      'test-t3':         '"Viajé por negocios y quedé impresionado por la combinación de lujo y funcionalidad. El business center y el servicio son excepcionales."',
      'country-es':      'España',
      'country-us':      'Estados Unidos',
      'country-br':      'Brasil',
      'promo-title':     'Reserve hoy y obtenga 10% de descuento',
      'promo-desc':      'Incluye desayuno buffet gratuito, acceso a spa y late check-out. Oferta válida por tiempo limitado.',
      'promo-btn':       'Reservar ahora',
      'book-title':      'Reserve su Estancia',
      'book-sub':        'Complete el formulario y uno de nuestros asesores le confirmará la disponibilidad.',
      'book-form-title': 'Formulario de Reserva',
      'book-checkin':    'Fecha de entrada',
      'book-checkout':   'Fecha de salida',
      'book-adults':     'Adultos',
      'book-children':   'Niños',
      'book-room':       'Tipo de habitación',
      'book-select':     'Seleccione...',
      'book-confirm':    'Confirmar Reserva',
      'sum-checkin':     'Entrada:',
      'sum-checkout':    'Salida:',
      'sum-nights':      'Noches:',
      'sum-room':        'Habitación:',
      'sum-total':       'Total estimado',
      'faq-title':       'Preguntas Frecuentes',
      'faq-sub':         'Todo lo que necesita saber antes de su llegada.',
      'faq-q1':          '¿Cuál es el horario de check-in y check-out?',
      'faq-a1':          'El check-in es a partir de las 15:00 horas y el check-out debe realizarse antes de las 12:00 del mediodía. Ofrecemos late check-out sujeto a disponibilidad.',
      'faq-q2':          '¿Ofrecen transporte desde el aeropuerto?',
      'faq-a2':          'Sí, contamos con un servicio de traslado en vehículos de lujo. Puede solicitarlo al momento de hacer su reserva.',
      'faq-q3':          '¿Las mascotas están permitidas?',
      'faq-a3':          'Sí, aceptamos mascotas en habitaciones seleccionadas con un cargo adicional. Le recomendamos informarnos al momento de la reserva.',
      'faq-q4':          '¿Incluye desayuno?',
      'faq-a4':          'El desayuno buffet está incluido en todas nuestras tarifas premium. Disfrute de una selección de platos internacionales.',
      'faq-q5':          '¿Hay estacionamiento disponible?',
      'faq-a5':          'Sí, contamos con estacionamiento cubierto con vigilancia las 24 horas. Es gratuito para huéspedes del hotel.',
      'faq-q6':          '¿Puedo cancelar o modificar mi reserva?',
      'faq-a6':          'Aceptamos cancelaciones sin cargo hasta 48 horas antes de la fecha de llegada. Para modificaciones, contacte a nuestro equipo.',
      'footer-address':  'Carrera 7 #12 - 63, Fundación, Magdalena, Colombia',
      'footer-maps':     'Abrir en Google Maps',
      'footer-desc':     'Un refugio de lujo en Fundación, Magdalena, donde cada momento se convierte en un recuerdo inolvidable. Déjese consentir por nuestro equipo de clase mundial.',
      'footer-links-title': 'Enlaces rápidos',
      'footer-rooms-title': 'Habitaciones',
      'footer-contact-title': 'Contacto',
      'footer-copy':     '\u00a9 2026 Hotel Luxury Fundación. Todos los derechos reservados. Diseñado con pasión.',
    },
    en: {
      'page-title':      'Hotel Luxury Fundación | 5 Star Hotel in Fundación, Magdalena, Colombia',
      'nav-about':       'The Hotel',
      'nav-rooms':       'Rooms',
      'nav-services':    'Services',
      'nav-gallery':     'Gallery',
      'nav-contact':     'Contact',
      'nav-book':        'Book Now',
      'nav-faq':         'FAQ',
      'hero-badge':      '5 Star Hotel',
      'hero-title':      'Where Luxury Finds Its Home',
      'hero-sub':        'Enjoy an unforgettable experience in Fundación, Magdalena, with panoramic views, world-class gastronomy, and the comfort you deserve.',
      'hero-book':       'Book Now',
      'hero-rooms':      'View Rooms',
      'hero-scroll':     'Discover',
      'qb-checkin':      'Check-in',
      'qb-checkout':     'Check-out',
      'qb-adults':       'Adults',
      'qb-children':     'Children',
      'qb-room':         'Room',
      'qb-book':         'Book',
      'room1':           'Suite Royal Horizon',
      'room2':           'Executive Gold',
      'room3':           'Sky Luxury Suite',
      'about-title':     'The Art of Hospitality in Fundación',
      'about-p1':        'Located in the heart of Fundación, Magdalena, Hotel Luxury Fundación is the perfect destination for those seeking a luxury experience on the Colombian Caribbean coast. Every detail is carefully thought out to exceed your expectations.',
      'about-p2':        'Enjoy top-tier facilities, an exceptional human team, and a privileged location near the main attractions of Magdalena, turning every visit into an unforgettable memory.',
      'about-spa':       'Spa & Wellness',
      'about-rest':      'Gourmet Restaurant',
      'about-view':      'Panoramic View',
      'about-service':   'Personalized Service',
      'rooms-title':     'Premium Rooms',
      'rooms-sub':       'Each of our suites has been designed to give you a unique experience of comfort and elegance.',
      'rooms-badge1':    'Most popular',
      'rooms-badge2':    'Exclusive',
      'rooms-desc1':     'Spacious suite with private terrace and sea view. Marble finishes and Italian textiles.',
      'rooms-desc2':     'Executive suite with work area, separate living room, and exclusive lounge access.',
      'rooms-desc3':     'Luxury penthouse with private pool, panoramic terrace, and 24/7 personal butler.',
      'rooms-guests1':   '2 guests',
      'rooms-guests2':   '3 guests',
      'rooms-guests3':   '4 guests',
      'rooms-view1':     'Sea',
      'rooms-view2':     'City',
      'rooms-view3':     'Panoramic',
      'rooms-book':      'Book Now',
      'per-night':       '/ night',
      'services-title':  'Premium Services',
      'services-sub':    'Everything you need for a perfect stay, at your disposal.',
      'sv-wifi':         'Premium WiFi',
      'sv-wifi-d':       'High-speed connection throughout the property',
      'sv-spa':          'Spa & Wellness',
      'sv-spa-d':        'Massages, sauna, jacuzzi, and beauty treatments',
      'sv-rest':         'Gourmet Restaurant',
      'sv-rest-d':       'Signature cuisine with local and seasonal ingredients',
      'sv-bar':          'Bar & Lounge',
      'sv-bar-d':        'Signature cocktails and live music',
      'sv-gym':          'Gym',
      'sv-gym-d':        'State-of-the-art Technogym equipment',
      'sv-room':         'Room Service 24h',
      'sv-room-d':       'Full menu available at any time',
      'sv-laundry':      'Laundry',
      'sv-laundry-d':    'Express washing and ironing service',
      'sv-parking':      'Parking',
      'sv-parking-d':    'Covered parking with 24h surveillance',
      'sv-transport':    'Airport Transfer',
      'sv-transport-d':  'Luxury vehicles with private chauffeur',
      'sv-concierge':    'Concierge',
      'sv-concierge-d':  'Personalized assistance for tours and events',
      'sv-business':     'Business Center',
      'sv-business-d':   'Meeting rooms and equipped offices',
      'sv-checkin':      'Express Check-in',
      'sv-checkin-d':    'Agile and hassle-free arrival process',
      'gallery-title':   'Gallery',
      'gallery-sub':     'Discover every corner of our hotel through these images.',
      'stats-title':     'Our Numbers',
      'stats-sub':       'The endorsement of those who choose us.',
      'stat1':           'Years of experience',
      'stat2':           'Satisfied guests',
      'stat3':           'Rating (4.9 ★)',
      'stat4':           '% Satisfaction',
      'test-title':      'What Our Guests Say',
      'test-sub':        'Real experiences from those who have already experienced luxury.',
      'test-t1':         '"An unforgettable experience. The service is impeccable, the facilities are top-notch, and the attention to detail is extraordinary."',
      'test-t2':         '"The best hotel I have ever stayed at. The Suite Royal Horizon exceeded all my expectations. The staff is very attentive."',
      'test-t3':         '"I traveled for business and was impressed by the combination of luxury and functionality. The business center and service are exceptional."',
      'country-es':      'Spain',
      'country-us':      'United States',
      'country-br':      'Brazil',
      'promo-title':     'Book today and get 10% off',
      'promo-desc':      'Includes free buffet breakfast, spa access, and late check-out. Limited time offer.',
      'promo-btn':       'Book Now',
      'book-title':      'Book Your Stay',
      'book-sub':        'Complete the form and one of our advisors will confirm availability.',
      'book-form-title': 'Booking Form',
      'book-checkin':    'Check-in Date',
      'book-checkout':   'Check-out Date',
      'book-adults':     'Adults',
      'book-children':   'Children',
      'book-room':       'Room Type',
      'book-select':     'Select...',
      'book-confirm':    'Confirm Booking',
      'sum-checkin':     'Check-in:',
      'sum-checkout':    'Check-out:',
      'sum-nights':      'Nights:',
      'sum-room':        'Room:',
      'sum-total':       'Estimated total',
      'faq-title':       'Frequently Asked Questions',
      'faq-sub':         'Everything you need to know before your arrival.',
      'faq-q1':          'What are the check-in and check-out times?',
      'faq-a1':          'Check-in is from 3:00 PM and check-out must be before 12:00 PM. Late check-out is available subject to availability.',
      'faq-q2':          'Do you offer airport transportation?',
      'faq-a2':          'Yes, we have a luxury vehicle transfer service. You can request it when making your reservation.',
      'faq-q3':          'Are pets allowed?',
      'faq-a3':          'Yes, we accept pets in selected rooms for an additional fee. We recommend letting us know at the time of booking.',
      'faq-q4':          'Is breakfast included?',
      'faq-a4':          'Buffet breakfast is included in all our premium rates. Enjoy a selection of international dishes.',
      'faq-q5':          'Is parking available?',
      'faq-a5':          'Yes, we have covered parking with 24-hour surveillance. Free for hotel guests.',
      'faq-q6':          'Can I cancel or modify my reservation?',
      'faq-a6':          'We accept free cancellations up to 48 hours before arrival. For modifications, please contact our team.',
      'footer-address':  'Carrera 7 #12-63, Fundación, Magdalena, Colombia',
      'footer-maps':     'Open in Google Maps',
      'footer-desc':     'A luxury refuge in Fundación, Magdalena, where every moment becomes an unforgettable memory. Let our world-class team take care of you.',
      'footer-links-title': 'Quick Links',
      'footer-rooms-title': 'Rooms',
      'footer-contact-title': 'Contact',
      'footer-copy':     '\u00a9 2026 Hotel Luxury Fundación. All rights reserved. Designed with passion.',
    },
  };

  let currentLang = localStorage.getItem('lang') || 'es';

  /* ---------- Flag SVGs ---------- */
  const FLAGS = {
    us: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 19 13" width="19" height="13"><rect y="0" width="19" height="1" fill="#B22234"/><rect y="1" width="19" height="1" fill="#FFF"/><rect y="2" width="19" height="1" fill="#B22234"/><rect y="3" width="19" height="1" fill="#FFF"/><rect y="4" width="19" height="1" fill="#B22234"/><rect y="5" width="19" height="1" fill="#FFF"/><rect y="6" width="19" height="1" fill="#B22234"/><rect y="7" width="19" height="1" fill="#FFF"/><rect y="8" width="19" height="1" fill="#B22234"/><rect y="9" width="19" height="1" fill="#FFF"/><rect y="10" width="19" height="1" fill="#B22234"/><rect y="11" width="19" height="1" fill="#FFF"/><rect y="12" width="19" height="1" fill="#B22234"/><rect width="8" height="7" fill="#3C3B6E"/></svg>',
    co: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 18 12" width="18" height="12"><rect width="18" height="12" fill="#FCD116"/><rect y="6" width="18" height="3" fill="#003893"/><rect y="9" width="18" height="3" fill="#CE1126"/></svg>',
  };

  /* ---------- Format helpers ---------- */
  function formatCOP(n) {
    return '$' + Number(n).toLocaleString('es-CO');
  }
  function formatUSD(n) {
    return '$' + Number(n / EXCHANGE_RATE).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  function formatPrice(cop, lang) {
    return lang === 'en' ? formatUSD(cop) : formatCOP(cop);
  }
  function priceUnit(lang) {
    return lang === 'en' ? '/ night' : '/ noche';
  }

  /* ---------- Apply language ---------- */
  function applyLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang === 'es' ? 'es' : 'en';

    /* Toggle button — US flag to switch to EN, CO flag to switch to ES */
    document.getElementById('langFlag').innerHTML = lang === 'es' ? FLAGS.us : FLAGS.co;
    document.getElementById('langLabel').textContent = lang === 'es' ? 'EN' : 'ES';

    /* Translate all data-i18n elements */
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = i18n[lang][key];
      if (text !== undefined) {
        /* Handle select options */
        if (el.tagName === 'OPTION') {
          el.textContent = text;
        } else {
          el.textContent = text;
        }
      }
    });

    /* Translate prices */
    document.querySelectorAll('[data-price-cop]').forEach(el => {
      const cop = parseInt(el.getAttribute('data-price-cop'), 10);
      if (isNaN(cop)) return;
      const small = el.querySelector('.price-unit');
      const text = formatPrice(cop, lang);
      el.childNodes[0].textContent = text;
      if (small) small.textContent = priceUnit(lang);
    });

    /* Translate booking form room options */
    document.querySelectorAll('#tipoHabitacion option[data-price-cop]').forEach(opt => {
      const cop = parseInt(opt.getAttribute('data-price-cop'), 10);
      const name = opt.getAttribute('data-i18n');
      const roomName = i18n[lang][name] || opt.textContent;
      if (lang === 'en') {
        opt.textContent = roomName + ' — $' + Math.round(cop / EXCHANGE_RATE) + '/night';
      } else {
        opt.textContent = roomName + ' — $' + cop.toLocaleString('es-CO') + '/noche';
      }
    });

    /* Update booking summary if visible */
    updateSummary?.();
  }

  /* ---------- Navbar scroll ---------- */
  const navbar = document.querySelector('.navbar');

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 60);
  });

  /* ---------- Mobile menu ---------- */
  const menuToggle = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  menuToggle?.addEventListener('click', () => {
    menuToggle.classList.toggle('open');
    navLinks.classList.toggle('open');
  });

  document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle?.classList.remove('open');
      navLinks?.classList.remove('open');
    });
  });

  document.addEventListener('click', (e) => {
    if (window.innerWidth > 768) return;
    if (navLinks?.classList.contains('open') && !e.target.closest('.nav-links') && !e.target.closest('.menu-toggle')) {
      menuToggle?.classList.remove('open');
      navLinks?.classList.remove('open');
    }
  });

  /* ---------- Language toggle ---------- */
  document.getElementById('langToggle').addEventListener('click', () => {
    applyLang(currentLang === 'es' ? 'en' : 'es');
  });

  /* ---------- Parallax Hero ---------- */
  const heroBg = document.querySelector('.hero-bg');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (heroBg && y < window.innerHeight) {
      heroBg.style.transform = `scale(1.05) translateY(${y * 0.15}px)`;
    }
  });

  /* ---------- Scroll reveal ---------- */
  const revealElements = document.querySelectorAll('.animate-up');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(el => observer.observe(el));

  /* ---------- Counter animation ---------- */
  const counters = document.querySelectorAll('.stat-number');
  const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.dataset.count, 10);
        if (isNaN(target)) return;
        let current = 0;
        const step = Math.ceil(target / 40);
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = current.toLocaleString();
        }, 40);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(el => counterObserver.observe(el));

  /* ---------- Constants ---------- */
  const WHATSAPP_NUM = '573103320565';
  const todayStr = new Date().toISOString().slice(0, 10);

  function buildWhatsAppMsg(data) {
    const lines = [
      '*Nueva Reserva — Hotel Luxury*',
      '',
      `Entrada: ${data.entrada || '—'}`,
      `Salida:  ${data.salida || '—'}`,
      `Adultos: ${data.adultos || '—'}`,
      `Ninos:   ${data.ninos || '0'}`,
      `Habitacion: ${data.tipoHab || '—'}`,
    ];
    if (data.noches) lines.push(`Noches: ${data.noches}`);
    if (data.total) lines.push(`Total: $${data.total}`);
    return encodeURIComponent(lines.join('\n'));
  }

  /* ---------- Quick booking bar ---------- */
  const qbEntrada = document.getElementById('qbEntrada');
  const qbSalida  = document.getElementById('qbSalida');
  if (qbEntrada) qbEntrada.setAttribute('min', todayStr);
  if (qbSalida)  qbSalida.setAttribute('min', todayStr);

  const qbForm = document.getElementById('quickBookingForm');
  qbForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const entrada = document.getElementById('qbEntrada')?.value || '';
    const salida  = document.getElementById('qbSalida')?.value || '';
    const adultos = document.getElementById('qbAdultos')?.value || '2';
    const ninos   = document.getElementById('qbNinos')?.value || '0';
    const tipoHabEl = document.getElementById('qbTipoHab');
    const tipoHab = tipoHabEl?.options[tipoHabEl.selectedIndex]?.text || '';

    const msg = buildWhatsAppMsg({ entrada, salida, adultos, ninos, tipoHab });
    window.open(`https://wa.me/${WHATSAPP_NUM}?text=${msg}`, '_blank');
  });

  /* ---------- Booking form ---------- */
  const form = document.getElementById('bookingForm');
  if (form) {
    const entrada = document.getElementById('fechaEntrada');
    const salida  = document.getElementById('fechaSalida');
    const adultos = document.getElementById('adultos');
    const ninos   = document.getElementById('ninos');
    const tipoHab = document.getElementById('tipoHabitacion');
    const summary = document.getElementById('bookingSummary');
    const submitBtn = form.querySelector('.btn');

    entrada.setAttribute('min', todayStr);

    window.updateSummary = function () {
      const eVal = entrada.value;
      const sVal = salida.value;
      const hab  = tipoHab.options[tipoHab.selectedIndex]?.text || '—';

      if (!eVal || !sVal) {
        summary.style.display = 'none';
        return;
      }

      const eDate = new Date(eVal);
      const sDate = new Date(sVal);
      const diff  = Math.ceil((sDate - eDate) / (1000 * 60 * 60 * 24));

      if (diff <= 0) {
        summary.style.display = 'none';
        return;
      }

      summary.style.display = 'grid';

      const selOpt = tipoHab.options[tipoHab.selectedIndex];
      const priceCop = parseInt(selOpt?.getAttribute('data-price-cop') || '0', 10);
      const total = diff * priceCop;

      document.getElementById('sumEntrada').textContent    = eVal;
      document.getElementById('sumSalida').textContent     = sVal;
      document.getElementById('sumNoches').textContent     = diff;
      document.getElementById('sumHabitacion').textContent = hab;
      document.getElementById('sumTotal').textContent      = formatPrice(total, currentLang);
    };

    [entrada, salida, tipoHab].forEach(el => {
      el.addEventListener('change', updateSummary);
      el.addEventListener('input', updateSummary);
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      let valid = true;

      document.querySelectorAll('.error').forEach(el => el.textContent = '');

      if (!entrada.value) {
        document.getElementById('errEntrada').textContent = currentLang === 'es' ? 'Selecciona una fecha de entrada' : 'Select a check-in date';
        valid = false;
      } else if (entrada.value < todayStr) {
        document.getElementById('errEntrada').textContent = currentLang === 'es' ? 'No puedes seleccionar una fecha pasada' : 'You cannot select a past date';
        valid = false;
      }

      if (!salida.value) {
        document.getElementById('errSalida').textContent = currentLang === 'es' ? 'Selecciona una fecha de salida' : 'Select a check-out date';
        valid = false;
      } else if (entrada.value && salida.value <= entrada.value) {
        document.getElementById('errSalida').textContent = currentLang === 'es' ? 'La salida debe ser posterior a la entrada' : 'Check-out must be after check-in';
        valid = false;
      }

      if (!adultos.value || parseInt(adultos.value) < 1) {
        document.getElementById('errAdultos').textContent = currentLang === 'es' ? 'Debe haber al menos 1 adulto' : 'At least 1 adult required';
        valid = false;
      }

      if (!tipoHab.value) {
        document.getElementById('errTipoHab').textContent = currentLang === 'es' ? 'Selecciona un tipo de habitación' : 'Select a room type';
        valid = false;
      }

      if (!valid) return;

      const tipoHabEl = document.getElementById('tipoHabitacion');
      const selText = tipoHabEl?.options[tipoHabEl.selectedIndex]?.text || '';
      const totalText = document.getElementById('sumTotal')?.textContent || '';
      const noches = document.getElementById('sumNoches')?.textContent || '';

      const msg = buildWhatsAppMsg({
        entrada: entrada.value,
        salida: salida.value,
        adultos: adultos.value,
        ninos: ninos.value,
        tipoHab: selText,
        noches,
        total: totalText,
      });
      window.open(`https://wa.me/${WHATSAPP_NUM}?text=${msg}`, '_blank');
    });
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(el => el.classList.remove('open'));
      if (!isOpen) item.classList.add('open');
    });
  });

  /* ---------- Back to top ---------- */
  const backBtn = document.querySelector('.back-to-top');
  window.addEventListener('scroll', () => {
    backBtn?.classList.toggle('visible', window.scrollY > 500);
  });
  backBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Init language ---------- */
  applyLang(currentLang);
});
