import { NextApiRequest, NextApiResponse } from "next";
import { MedCategory, DosageUnit } from "@prisma/client";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.status(200).json({
        categories: Object.values(MedCategory),
        units: Object.values(DosageUnit),
    });
}
