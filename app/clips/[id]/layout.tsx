import { createClient } from "@/utils/supabase/server";
import { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";

type Props = {
  params: { id: string };
  children: React.ReactNode;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const cookieStore = cookies();
  const supabase = createClient(cookieStore);
  
  try {
    const { data: clipData, error } = await supabase
      .from("auto_clips")
      .select(`
        *,
        cars!car_id (
          id, make, model, year, images, price, mileage, condition
        ),
        dealerships!dealership_id (
          id, name, logo, phone, location, latitude, longitude
        )
      `)
      .eq("id", params.id)
      .eq("status", "published")
      .single();

    // Return notFound metadata if clip doesn't exist
    if (!clipData || error) {
      return {
        title: "Video Not Found | Fleet",
        description: "The requested video could not be found.",
        robots: "noindex, nofollow",
      };
    }

    // Get car and dealership info
    const car = clipData.cars;
    const dealership = clipData.dealerships;
    
    // Process car images
    let carImages: string[] = [];
    if (car?.images) {
      try {
        if (typeof car.images === "string") {
          carImages = JSON.parse(car.images);
        } else if (Array.isArray(car.images)) {
          carImages = car.images;
        }
      } catch (e) {
        console.error("Error parsing car images:", e);
        carImages = [];
      }
    }

    // Build title and description
    const title = car 
      ? `${car.year} ${car.make} ${car.model} - Video | Fleet`
      : clipData.title 
        ? `${clipData.title} | Fleet`
        : "Vehicle Video | Fleet";

    const description = clipData.description ||
      (car 
        ? `Watch this video of a ${car.year} ${car.make} ${car.model}${car.price ? ` priced at $${car.price.toLocaleString()}` : ''}${dealership?.name ? ` at ${dealership.name}` : ''}.`
        : "Watch this automotive video on Fleet - your premier car marketplace.");

    // Use car image or video thumbnail for social sharing
    const socialImages = [];
    if (carImages.length > 0) {
      socialImages.push({
        url: carImages[0].startsWith('http') ? carImages[0] : `https://www.fleetapp.me${carImages[0]}`,
        alt: car ? `${car.year} ${car.make} ${car.model}` : "Vehicle",
        width: 1200,
        height: 630,
      });
    } else if (clipData.thumbnail_url) {
      socialImages.push({
        url: clipData.thumbnail_url.startsWith('http') ? clipData.thumbnail_url : `https://www.fleetapp.me${clipData.thumbnail_url}`,
        alt: "Video thumbnail",
        width: 1200,
        height: 630,
      });
    }

    // Generate keywords
    const keywords = [
      car?.make,
      car?.model,
      car?.year?.toString(),
      car?.condition,
      dealership?.name,
      dealership?.location,
      'car video',
      'automotive video',
      'vehicle showcase',
      'car dealership',
      'auto clips',
      'Fleet marketplace'
    ].filter(Boolean).join(', ');

    // Structured data for the video
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "VideoObject",
      "name": title,
      "description": description,
      "url": `https://www.fleetapp.me/clips/${params.id}`,
      "contentUrl": clipData.video_url,
      "thumbnailUrl": carImages.length > 0 ? carImages[0] : clipData.thumbnail_url,
      "uploadDate": clipData.created_at,
      "duration": "PT0M30S", // Default to 30 seconds, you can update this based on actual video duration
      "publisher": {
        "@type": "Organization",
        "name": "Fleet",
        "logo": "https://www.fleetapp.me/logo.png"
      },
      ...(car && {
        "about": {
          "@type": "Car",
          "name": `${car.year} ${car.make} ${car.model}`,
          "brand": {
            "@type": "Brand",
            "name": car.make
          },
          "model": car.model,
          "vehicleYear": car.year,
          ...(car.price && {
            "offers": {
              "@type": "Offer",
              "price": car.price,
              "priceCurrency": "USD"
            }
          })
        }
      }),
      ...(dealership && {
        "creator": {
          "@type": "AutoDealer",
          "name": dealership.name,
          "address": dealership.location
        }
      })
    };

    return {
      title,
      description,
      keywords,
      authors: [{ name: "Fleet Marketplace" }],
      creator: "Fleet",
      publisher: "Fleet",
      formatDetection: {
        telephone: false,
      },
      robots: {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-video-preview': -1,
          'max-image-preview': 'large',
          'max-snippet': -1,
        },
      },
      openGraph: {
        title,
        description,
        url: `https://www.fleetapp.me/clips/${params.id}`,
        siteName: "Fleet - Your car marketplace",
        images: socialImages,
        locale: "en_US",
        type: "video.other",
        videos: [
          {
            url: clipData.video_url,
            width: 1280,
            height: 720,
          }
        ],
      },
      twitter: {
        card: "player",
        title,
        description,
        images: socialImages.length > 0 ? [socialImages[0].url] : [],
        players: {
          playerUrl: `https://www.fleetapp.me/clips/${params.id}`,
          streamUrl: clipData.video_url,
          width: 1280,
          height: 720,
        },
      },
      alternates: {
        canonical: `https://www.fleetapp.me/clips/${params.id}`,
      },
      appLinks: {
        ios: {
          url: `fleet://clips/${params.id}`,
          appStoreId: "6742141291",
        },
        android: {
          package: "com.qwertyapp.clerkexpoquickstart",
          url: `fleet://clips/${params.id}`,
        },
      },
      other: {
        "al:ios:url": `fleet://clips/${params.id}`,
        "al:ios:app_store_id": "6742141291",
        "al:ios:app_name": "Fleet",
        "al:android:url": `fleet://clips/${params.id}`,
        "al:android:package": "com.qwertyapp.clerkexpoquickstart",
        "al:android:app_name": "Fleet",
        "apple-itunes-app": `app-id=6742141291, app-argument=https://www.fleetapp.me/clips/${params.id}`,
        // Video-specific metadata
        "video:duration": "30",
        "video:tag": keywords,
      },
    };
  } catch (error) {
    console.error("Error generating clip metadata:", error);
    return {
      title: "Video | Fleet",
      description: "Watch automotive videos on Fleet marketplace.",
      robots: "noindex, nofollow",
    };
  }
}

export default function ClipDetailsLayout({ children }: Props) {
  return <>{children}</>;
}