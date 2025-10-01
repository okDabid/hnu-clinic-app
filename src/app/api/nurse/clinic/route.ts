import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET all clinics
export async function GET() {
    const clinics = await prisma.clinic.findMany();
    return NextResponse.json(clinics);
}

// POST create new clinic
{/*export async function POST(req: Request) {
  const { clinic_name, clinic_location, clinic_contactno } = await req.json();
  const newClinic = await prisma.clinic.create({
    data: { clinic_name, clinic_location, clinic_contactno },
  });
  return NextResponse.json(newClinic);
}
*/}