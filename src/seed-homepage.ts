import { prisma } from './app/shared/prisma';

const homepageData = [
  {
    sectionSlug: "homepage",
    pageSlug: "hero",
    title: "Innovating Electronics Manufacturing",
    content: "SysPCB provides end-to-end PCB Fabrication and Assembly solutions. High precision, fast turnaround, and enterprise-grade reliability.",
    images: [
      "/pcbimage/pcbs1.jpg",
      "/pcbimage/10005.jpg",
      "/image/10006.jpg",
      "/pcbimage/10008.jpg",
      "/image/10010.jpg",
    ],
    specifications: {
      ctaPrimary: "Get Instant Quote",
      ctaSecondary: "Explore Capabilities"
    },
    order: 1,
    status: "PUBLISHED"
  },
  {
    sectionSlug: "homepage",
    pageSlug: "about",
    title: "Who We Are",
    content: "Established in 2004, SysPCB is a high-tech enterprise specializing in printed circuit board manufacturing and assembly. Our global footprint ensures top-tier quality and efficiency.",
    images: ["/pcbimage/pcbs2.jpg", "/image/10012.jpg", "/pcbimage/10010.jpg"],
    specifications: {
      stats: [
        { label: "Years Experience", value: "20+" },
        { label: "Global Clients", value: "5000+" },
        { label: "Production Area", value: "50,000 sqm" }
      ]
    },
    order: 2,
    status: "PUBLISHED"
  },
  {
    sectionSlug: "homepage",
    pageSlug: "capability",
    title: "Our Manufacturing Capabilities",
    content: "From simple single-sided boards to complex HDI and rigid-flex PCBs, we have the technology to bring your designs to life.",
    images: [
      "/pcbimage/10018.jpg",
      "/image/10019.jpg",
      "/pcbimage/10019.jpg",
      "/image/10021.jpg",
    ],
    specifications: {
      features: [
        { title: "High-Density Interconnect", desc: "Advanced HDI boards for compact devices." },
        { title: "Rigid-Flex", desc: "Combining flexibility and structural integrity." },
        { title: "Heavy Copper", desc: "For high-current and thermal dissipation." },
        { title: "RF/Microwave", desc: "High-frequency boards for communications." }
      ]
    },
    order: 3,
    status: "PUBLISHED"
  },
  {
    sectionSlug: "homepage",
    pageSlug: "assembly",
    title: "PCB Assembly Services",
    content: "Full Turnkey, Partial Turnkey, and Kitted PCB Assembly options tailored to your needs.",
    images: [
      "/pcbimage/10020.jpg",
      "/image/10022.jpg",
      "/pcbimage/10021.jpg",
      "/image/10023.jpg",
      "/pcbimage/10022.jpg",
      "/image/10025.jpg",
    ],
    specifications: {
      features: [
        { title: "SMT & THT", desc: "Surface Mount and Through-Hole Technology." },
        { title: "BGA Placement", desc: "X-Ray inspection for BGA packaging." },
        { title: "Testing", desc: "AOI, ICT, and Functional Testing." }
      ]
    },
    order: 4,
    status: "PUBLISHED"
  },
  {
    sectionSlug: "homepage",
    pageSlug: "quality",
    title: "Quality Assurance",
    content: "We adhere to the strictest global quality standards. Every board is rigorously tested before dispatch.",
    images: ["/pcbimage/10023.jpg", "/image/10026.jpg"],
    specifications: {
      certifications: ["ISO 9001", "ISO 14001", "UL Certified", "RoHS Compliant"]
    },
    order: 5,
    status: "PUBLISHED"
  },
  {
    sectionSlug: "homepage",
    pageSlug: "industries",
    title: "Industries We Serve",
    content: "Our PCBs power innovations across multiple high-demand sectors globally.",
    images: [
      "/pcbimage/10024.jpg",
      "/image/10027.jpg",
      "/pcbimage/10025.jpg",
      "/image/10028.jpg",
      "/pcbimage/10027.jpg",
      "/image/10029.jpg",
    ],
    specifications: {
      industries: [
        "Aerospace & Defense",
        "Automotive Electronics",
        "Medical Devices",
        "Telecommunications",
        "Consumer Electronics",
        "Industrial Automation"
      ]
    },
    order: 6,
    status: "PUBLISHED"
  },
  {
    sectionSlug: "homepage",
    pageSlug: "factory",
    title: "State-of-the-Art Factory",
    content: "Take a look inside our intelligent manufacturing facilities.",
    images: [
      "/pcbimage/10028.jpg",
      "/image/10030.jpg",
      "/pcbimage/10031.jpg",
      "/image/10031.jpg",
      "/pcbimage/10032.jpg",
      "/pcbimage/10034.jpg",
    ],
    specifications: {},
    order: 7,
    status: "PUBLISHED"
  },
  {
    sectionSlug: "homepage",
    pageSlug: "contact",
    title: "Ready to start your project?",
    content: "Get in touch with our engineering team today.",
    images: [],
    specifications: {
      email: "sales@syspcb.com",
      phone: "+86 123 4567 8900",
      address: "Shenzhen, Guangdong, China"
    },
    order: 8,
    status: "PUBLISHED"
  }
];

async function main() {
  console.log("Seeding Homepage Data...");
  
  for (const data of homepageData) {
    const existing = await prisma.page.findUnique({
      where: {
        sectionSlug_pageSlug: {
          sectionSlug: data.sectionSlug,
          pageSlug: data.pageSlug
        }
      }
    });

    if (existing) {
      await prisma.page.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          content: data.content,
          images: data.images,
          specifications: data.specifications,
          order: data.order
        }
      });
      console.log(`Updated ${data.pageSlug}`);
    } else {
      await prisma.page.create({
        data: {
          sectionSlug: data.sectionSlug,
          pageSlug: data.pageSlug,
          title: data.title,
          content: data.content,
          images: data.images,
          specifications: data.specifications,
          order: data.order,
          status: "PUBLISHED" as any
        }
      });
      console.log(`Created ${data.pageSlug}`);
    }
  }

  console.log("Homepage seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
