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
  const { data: carData, error } = await supabase
    .from("cars")
    .select(
      `
      *,
      dealerships (
        id, name, logo, phone, location, latitude, longitude
      )
    `
    )
    .eq("id", params.id)
    .single();

  // Return notFound if car doesn't exist
  if (!carData || error) {
    return {
      title: "Car Not Found | Fleet",
      description: "The requested car listing could not be found.",
    };
  }

  // Process images
  let images = [];
  try {
    if (typeof carData.images === "string") {
      images = JSON.parse(carData.images);
    } else if (Array.isArray(carData.images)) {
      images = carData.images;
    }
  } catch (e) {
    console.error("Error parsing images:", e);
    images = [];
  }

  // Get dealership info
  const dealershipName =
    carData.dealerships?.name || carData.dealership_name || "Unknown Dealership";

  // Build absolute URLs for images
  const imageUrls = images.length > 0 
    ? [{ 
        url: images[0].startsWith('http') ? images[0] : `https://www.fleetapp.me${images[0]}`,
        alt: `${carData.year} ${carData.make} ${carData.model}`
      }]
    : [];
    
  // Generate metadata
  return {
    title: `${carData.year} ${carData.make} ${carData.model} | Fleet`,
    description: `${carData.year} ${carData.make} ${carData.model} for $${carData.price.toLocaleString()} at ${dealershipName}`,
    openGraph: {
      title: `${carData.year} ${carData.make} ${carData.model} | Fleet`,
      description: `${carData.year} ${carData.make} ${carData.model} for $${carData.price.toLocaleString()} at ${dealershipName}`,
      url: `https://www.fleetapp.me/cars/${params.id}`,
      siteName: "Fleet - Your car marketplace",
      images: imageUrls,
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${carData.year} ${carData.make} ${carData.model} | Fleet`,
      description: `${carData.year} ${carData.make} ${carData.model} for $${carData.price.toLocaleString()} at ${dealershipName}`,
      images: images.length > 0 ? [images[0]] : [],
    },
    alternates: {
      canonical: `https://www.fleetapp.me/cars/${params.id}`,
    },
    appLinks: {
      ios: {
        url: `fleet://cars/${params.id}`,
        appStoreId: "6742141291",
      },
      android: {
        package: "com.qwertyapp.clerkexpoquickstart",
        url: `fleet://cars/${params.id}`,
      },
    },
    other: {
      "al:ios:url": `fleet://cars/${params.id}`,
      "al:ios:app_store_id": "6742141291",
      "al:ios:app_name": "Fleet",
      "al:android:url": `fleet://cars/${params.id}`,
      "al:android:package": "com.qwertyapp.clerkexpoquickstart",
      "al:android:app_name": "Fleet",
      "apple-itunes-app": `app-id=6742141291, app-argument=https://www.fleetapp.me/cars/${params.id}`,
    },
  };
}

export default function CarDetailsLayout({ children }: Props) {
  return <>{children}</>;
}