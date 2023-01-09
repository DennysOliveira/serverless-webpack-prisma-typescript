import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { APIResponse } from '@libs/response';


const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { id } = event.pathParameters as { id: string };

  const prisma = new PrismaClient();

  const sitemap = await prisma.sitemap.findUnique({
    where: {
      id: Number(id),
    },
  });

  if (!sitemap) {
    return APIResponse({
      status: 404,
      data: {
        message: 'Sitemap not found',
      },
    })
  }




  // update sitemap to enabled
  const updatedSitemap = await prisma.sitemap.update({
    where: {
      id: Number(sitemap.id),
    },
    data: {
      nextRun: new Date(),
    },
  });

  if (!updatedSitemap) {
    return APIResponse({
      status: 400,
      data: {
        message: 'Failed to update sitemap',
      },
    })
  }
  

  return APIResponse({
    status: 200,
    data: {
      message: 'Sitemap snapshot scheduled successfully.'
    }
  })
};

export { handler };