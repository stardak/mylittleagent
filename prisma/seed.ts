import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function seed() {
    console.log("🌱 Seeding database with The Michalaks data...");

    // 1. Create demo user
    const passwordHash = await bcrypt.hash("demo1234", 12);

    const user = await prisma.user.upsert({
        where: { email: "stefan@digital-farm.co.uk" },
        update: { isAdmin: true },
        create: {
            email: "stefan@digital-farm.co.uk",
            name: "Stef Michalak",
            passwordHash,
            isAdmin: true,
        },
    });
    console.log("✅ User created:", user.email);

    // 2. Create workspace
    const workspace = await prisma.workspace.upsert({
        where: { slug: "the-michalaks" },
        update: {},
        create: {
            name: "The Michalaks",
            slug: "the-michalaks",
            plan: "pro",
        },
    });
    console.log("✅ Workspace created:", workspace.name);

    // 3. Create membership
    await prisma.membership.upsert({
        where: {
            userId_workspaceId: {
                userId: user.id,
                workspaceId: workspace.id,
            },
        },
        update: {},
        create: {
            userId: user.id,
            workspaceId: workspace.id,
            role: "owner",
        },
    });
    console.log("✅ Membership created");

    // 4. Create brand profile from BRAND.md
    await prisma.brandProfile.upsert({
        where: { workspaceId: workspace.id },
        update: {
            brandName: "The Michalaks",
            tagline: "Story-Driven Content Creators",
            bio: "UK-based family content creators known for cinematic vlogging and authentic storytelling. Building a premium lifestyle brand across YouTube, Instagram, and TikTok since 2012. Relocated to Portugal in 2024. Content spans family life, travel, fashion, home design, and personal growth — always through a cinematic lens.",
            location: "Portugal (relocated from Bath, UK)",
            contactEmail: "stefan@digital-farm.co.uk",
            website: "https://www.themichalaks.co.uk",
            toneOfVoice: "Warm, authentic, cinematic, aspirational but relatable, honest, premium quality",
            contentCategories: ["Lifestyle", "Family", "Travel", "Fashion", "Home", "Vlogging", "Food & Drink"],
            keyDifferentiators: "Cinematic production quality that rivals TV. Authentic family storytelling. Long-form YouTube expertise with proven engagement. Premium brand aesthetic. UK's leading family lifestyle creators. Self-managed for maximum creative control.",
            businessName: "Digital Farm Ltd",
            paymentTerms: "net-30",
            currency: "GBP",
            audienceSummary: "65% Female, 35% Male. Core age: 25-44 (72%). Top countries: UK (45%), USA (18%), Australia (8%). Interests: Family lifestyle, travel, fashion, home decor, parenting. Higher income bracket, homeowners, decision-makers for family purchases.",
            rateCard: `YouTube Integration: £8,000-£15,000
YouTube Dedicated Video: £15,000-£25,000
Instagram Reel: £3,000-£5,000
Instagram Story Set (3-5 frames): £1,500-£3,000
Instagram Static Post: £2,000-£4,000
TikTok Video: £2,000-£4,000
Bundle (YT + IG + TT): from £12,000
Event Attendance: from £5,000
Brand Ambassador (quarterly): from £30,000
Brand Ambassador (annual): from £80,000
Usage Rights: +25-50%
Exclusivity: +30-100% depending on duration`,
        },
        create: {
            workspaceId: workspace.id,
            brandName: "The Michalaks",
            tagline: "Story-Driven Content Creators",
            bio: "UK-based family content creators known for cinematic vlogging and authentic storytelling. Building a premium lifestyle brand across YouTube, Instagram, and TikTok since 2012. Relocated to Portugal in 2024. Content spans family life, travel, fashion, home design, and personal growth — always through a cinematic lens.",
            location: "Portugal (relocated from Bath, UK)",
            contactEmail: "stefan@digital-farm.co.uk",
            website: "https://www.themichalaks.co.uk",
            toneOfVoice: "Warm, authentic, cinematic, aspirational but relatable, honest, premium quality",
            contentCategories: ["Lifestyle", "Family", "Travel", "Fashion", "Home", "Vlogging", "Food & Drink"],
            keyDifferentiators: "Cinematic production quality that rivals TV. Authentic family storytelling. Long-form YouTube expertise with proven engagement. Premium brand aesthetic. UK's leading family lifestyle creators. Self-managed for maximum creative control.",
            businessName: "Digital Farm Ltd",
            paymentTerms: "net-30",
            currency: "GBP",
            audienceSummary: "65% Female, 35% Male. Core age: 25-44 (72%). Top countries: UK (45%), USA (18%), Australia (8%). Interests: Family lifestyle, travel, fashion, home decor, parenting. Higher income bracket, homeowners, decision-makers for family purchases.",
            rateCard: `YouTube Integration: £8,000-£15,000
YouTube Dedicated Video: £15,000-£25,000
Instagram Reel: £3,000-£5,000
Instagram Story Set (3-5 frames): £1,500-£3,000
Instagram Static Post: £2,000-£4,000
TikTok Video: £2,000-£4,000
Bundle (YT + IG + TT): from £12,000
Event Attendance: from £5,000
Brand Ambassador (quarterly): from £30,000
Brand Ambassador (annual): from £80,000
Usage Rights: +25-50%
Exclusivity: +30-100% depending on duration`,
        },
    });
    console.log("✅ Brand profile created");

    // 5. Create platforms
    await prisma.platform.deleteMany({ where: { workspaceId: workspace.id } });

    await prisma.platform.createMany({
        data: [
            {
                workspaceId: workspace.id,
                type: "youtube",
                handle: "@TheMichalaks",
                displayName: "The Michalaks",
                followers: 680000,
                avgViews: 85000,
                totalViews: 350000000,
                engagementRate: 4.2,
                genderFemale: 65,
                ageRange1: "25-34",
                ageRange1Pct: 42,
                topCountry1: "United Kingdom",
                topCountry1Pct: 45,
                demographics: {
                    genderSplit: { female: 65, male: 35 },
                    ageGroups: { "18-24": 12, "25-34": 42, "35-44": 30, "45-54": 11, "55+": 5 },
                    topCountries: { "UK": 45, "USA": 18, "Australia": 8, "Canada": 5, "Germany": 4 },
                },
            },
            {
                workspaceId: workspace.id,
                type: "instagram",
                handle: "@themichalaks",
                displayName: "The Michalaks",
                followers: 320000,
                avgViews: 45000,
                engagementRate: 3.8,
                storyOpens: 25000,
                genderFemale: 70,
                ageRange1: "25-34",
                ageRange1Pct: 45,
                topCountry1: "United Kingdom",
                topCountry1Pct: 52,
                demographics: {
                    genderSplit: { female: 70, male: 30 },
                    ageGroups: { "18-24": 15, "25-34": 45, "35-44": 28, "45-54": 8, "55+": 4 },
                    topCountries: { "UK": 52, "USA": 15, "Australia": 7, "Ireland": 4, "France": 3 },
                },
            },
            {
                workspaceId: workspace.id,
                type: "tiktok",
                handle: "@themichalaks",
                displayName: "The Michalaks",
                followers: 95000,
                avgViews: 120000,
                engagementRate: 6.1,
                genderFemale: 62,
                ageRange1: "18-24",
                ageRange1Pct: 38,
                topCountry1: "United Kingdom",
                topCountry1Pct: 40,
                demographics: {
                    genderSplit: { female: 62, male: 38 },
                    ageGroups: { "18-24": 38, "25-34": 35, "35-44": 18, "45+": 9 },
                    topCountries: { "UK": 40, "USA": 22, "Australia": 8, "Canada": 6 },
                },
            },
        ],
    });
    console.log("✅ Platforms created (YouTube, Instagram, TikTok)");

    // 6. Create case studies
    await prisma.caseStudy.deleteMany({ where: { workspaceId: workspace.id } });

    await prisma.caseStudy.createMany({
        data: [
            {
                workspaceId: workspace.id,
                brandName: "Land Rover",
                industry: "Automotive",
                brief: "Multi-year ambassador partnership showcasing the Defender and Discovery Sport through family road trips and adventure content",
                result: "Series of high-performing YouTube integrations with consistent 200K+ views per video, significant brand lift",
                contentUrl: "https://www.youtube.com/watch?v=XYZ_LandRover",
                featured: true,
            },
            {
                workspaceId: workspace.id,
                brandName: "John Lewis",
                industry: "Retail",
                brief: "Seasonal home content partnership featuring new collections and family life moments",
                result: "Drove measurable traffic and engagement, repeat bookings across multiple seasons",
                contentUrl: "https://www.youtube.com/watch?v=XYZ_JohnLewis",
                featured: true,
            },
            {
                workspaceId: workspace.id,
                brandName: "GoHenry",
                industry: "FinTech",
                brief: "Dedicated YouTube video and national TV advertisement for children's financial education app",
                result: "First creator to feature in a GoHenry TV ad, cross-platform reach exceeding 2M impressions",
                contentUrl: "https://www.youtube.com/watch?v=XYZ_GoHenry",
                featured: true,
            },
            {
                workspaceId: workspace.id,
                brandName: "LEGO",
                industry: "Toys & Games",
                brief: "Family-focused content partnership around new product launches and creative play",
                result: "High engagement rates with strong sentiment in comments, repeat campaign bookings",
                contentUrl: "https://www.youtube.com/watch?v=XYZ_LEGO",
                featured: false,
            },
            {
                workspaceId: workspace.id,
                brandName: "Center Parcs",
                industry: "Travel & Hospitality",
                brief: "Family holiday content showcasing activities and accommodation options",
                result: "Top-performing creator content in their influencer programme, 300K+ combined views",
                contentUrl: "https://www.youtube.com/watch?v=XYZ_CenterParcs",
                featured: false,
            },
        ],
    });
    console.log("✅ Case studies created (5 brands)");

    // 7. Create testimonials
    await prisma.testimonial.deleteMany({ where: { workspaceId: workspace.id } });

    await prisma.testimonial.createMany({
        data: [
            {
                workspaceId: workspace.id,
                quote: "The Michalaks consistently deliver content that exceeds our expectations. Their production quality is on par with our own creative agency and their audience engagement is remarkable.",
                authorName: "Sarah Thompson",
                authorTitle: "Head of Influencer Marketing",
                company: "Land Rover UK",
                featured: true,
            },
            {
                workspaceId: workspace.id,
                quote: "Working with Stef and the team is always a pleasure. They understand brand objectives while keeping content authentic to their audience. The results speak for themselves.",
                authorName: "James Oliver",
                authorTitle: "Social Media Director",
                company: "John Lewis",
                featured: true,
            },
            {
                workspaceId: workspace.id,
                quote: "The Michalaks brought a level of creativity and professionalism to our campaign that we hadn't seen from other creators. Their audience trust translates directly into action.",
                authorName: "Rachel Chen",
                authorTitle: "Brand Partnerships Lead",
                company: "GoHenry",
                featured: true,
            },
        ],
    });
    console.log("✅ Testimonials created (3)");

    // 7b. Create sample discount codes
    await prisma.discountCode.deleteMany({});

    await prisma.discountCode.createMany({
        data: [
            {
                code: "LAUNCH20",
                type: "percentage",
                value: 20,
                duration: "first_month",
                isActive: true,
            },
            {
                code: "EARLYBIRD",
                type: "percentage",
                value: 30,
                duration: "months",
                durationMonths: 3,
                maxRedemptions: 50,
                isActive: true,
            },
            {
                code: "FRIEND10",
                type: "fixed",
                value: 10,
                duration: "first_month",
                isActive: false,
            },
        ],
    });
    console.log("✅ Discount codes created (3)");

    // 8. Mark onboarding as complete
    await prisma.setting.upsert({
        where: {
            workspaceId_key: { workspaceId: workspace.id, key: "onboarding_complete" },
        },
        update: { value: "true" },
        create: { workspaceId: workspace.id, key: "onboarding_complete", value: "true" },
    });
    console.log("✅ Onboarding marked complete");

    console.log("\n🎉 Seed complete! Login with:");
    console.log("   Email: stefan@digital-farm.co.uk");
    console.log("   Password: demo1234");
}

seed()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
