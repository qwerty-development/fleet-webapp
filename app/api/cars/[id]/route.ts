import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    // Validate id is a number
    if (!/^\d+$/.test(id)) {
      return NextResponse.json(
        { error: 'Invalid car ID' },
        { status: 400 }
      );
    }
    const cookieStore = cookies();
    // Create supabase server client
    const supabase = createClient(cookieStore);

    // Fetch car data from Supabase
    const { data, error } = await supabase
      .from('cars')
      .select('*, dealerships (name, logo, phone, location, latitude, longitude)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch car data' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Car not found' },
        { status: 404 }
      );
    }

    // Process images
    let images = [];
    try {
      if (typeof data.images === 'string') {
        images = JSON.parse(data.images);
      } else if (Array.isArray(data.images)) {
        images = data.images;
      }
    } catch (e) {
      console.error('Error parsing images:', e);
      images = [];
    }

    // Process features
    let features = [];
    try {
      if (typeof data.features === 'string') {
        features = JSON.parse(data.features);
      } else if (Array.isArray(data.features)) {
        features = data.features;
      }
    } catch (e) {
      console.error('Error parsing features:', e);
      features = [];
    }

    // Format the data for the response
    const formattedData = {
      ...data,
      images: images,
      features: features,
      dealership_name: data.dealerships?.name,
      dealership_logo: data.dealerships?.logo,
      dealership_phone: data.dealerships?.phone,
      dealership_location: data.dealerships?.location,
      dealership_latitude: data.dealerships?.latitude,
      dealership_longitude: data.dealerships?.longitude,
    };

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error('Error fetching car:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}