import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { APIResponse } from 'src/helpers/response';


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

  if(sitemap.enabled) {
    return APIResponse({
      status: 409,
      data: {
        message: 'Sitemap already enabled',
      },
    })
  }


  // update sitemap to enabled
  const updatedSitemap = await prisma.sitemap.update({
    where: {
      id: Number(sitemap.id),
    },
    data: {
      enabled: true,
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
      message: 'Sitemap enabled successfully.'
    }
  })
};

export { handler };