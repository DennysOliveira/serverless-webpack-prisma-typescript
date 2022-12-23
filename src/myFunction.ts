import { PrismaClient } from "@prisma/client";

export const handler = async (event: any, context: any) => {
  const prisma = new PrismaClient();
  const result = await prisma.sitemap.findMany();

  console.log(result);

  return {    
    statusCode: 200,
    body: JSON.stringify(result),
  };
};
