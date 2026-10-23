import React, { createContext, useContext, useEffect, useState } from "react";

export interface SiteContent {
  branding: {
    businessName: string;
    tagline: string;
    shortDescription: string;
  };
  contact: {
    phone: string;
    whatsapp: string;
    email: string;
    city: string;
    hours: string;
  };
  publicMenuSection: {
    title: string;
    subtitle: string;
    ctaText: string;
  };
  footerCopy: {
    copyrightText: string;
    note: string;
  };
}

const defaultContent: SiteContent = {
  branding: {
    businessName: "Catering & Eventos",
    tagline: "Experiencias gastronómicas inolvidables",
    shortDescription: "Servicio integral de banquetes y catering gourmet.",
  },
  contact: {
    phone: "+52 55 0000 0000",
    whatsapp: "5215500000000",
    email: "info@catering.com",
    city: "Monterrey, Nuevo León",
    hours: "Lun - Sáb: 9:00 - 19:00",
  },
  publicMenuSection: {
    title: "Nuestro Menú",
    subtitle: "Platillos seleccionados para eventos especiales.",
    ctaText: "Solicitar cotización",
  },
  footerCopy: {
    copyrightText: "© 2026 Catering. Todos los derechos reservados.",
    note: "Precios sujetos a cotización final.",
  },
};

const ContentContext = createContext<{
  content: SiteContent;
  loading: boolean;
}>({
  content: defaultContent,
  loading: true,
});

export const ContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [content, setContent] = useState<SiteContent>(defaultContent);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("./content/site-content.xml")
      .then((res) => res.text())
      .then((xmlText) => {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, "text/xml");

        const getVal = (parentTag: string, tag: string, fallback = "") => {
          const parent = xmlDoc.getElementsByTagName(parentTag)[0];
          return parent?.getElementsByTagName(tag)[0]?.textContent || fallback;
        };

        setContent({
          branding: {
            businessName: getVal("branding", "businessName", defaultContent.branding.businessName),
            tagline: getVal("branding", "tagline", defaultContent.branding.tagline),
            shortDescription: getVal("branding", "shortDescription", defaultContent.branding.shortDescription),
          },
          contact: {
            phone: getVal("contact", "phone", defaultContent.contact.phone),
            whatsapp: getVal("contact", "whatsapp", defaultContent.contact.whatsapp),
            email: getVal("contact", "email", defaultContent.contact.email),
            city: getVal("contact", "city", defaultContent.contact.city),
            hours: getVal("contact", "hours", defaultContent.contact.hours),
          },
          publicMenuSection: {
            title: getVal("publicMenuSection", "title", defaultContent.publicMenuSection.title),
            subtitle: getVal("publicMenuSection", "subtitle", defaultContent.publicMenuSection.subtitle),
            ctaText: getVal("publicMenuSection", "ctaText", defaultContent.publicMenuSection.ctaText),
          },
          footerCopy: {
            copyrightText: getVal("footerCopy", "copyrightText", defaultContent.footerCopy.copyrightText),
            note: getVal("footerCopy", "note", defaultContent.footerCopy.note),
          },
        });
      })
      .catch((err) => {
        console.warn("No se pudo cargar el XML de configuración, usando fallback:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <ContentContext.Provider value={{ content, loading }}>
      {children}
    </ContentContext.Provider>
  );
};

export const useSiteContent = () => useContext(ContentContext);
