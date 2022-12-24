import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { APIResponse } from './helpers/response';

const create = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // receives a name and url
  if(!event.body) throw new Error('No body provided');
  const { name, url } = JSON.parse(event.body) as { name: string; url: string };

  console.log('name', name);

  // validate with zod
  try {
    const schema = z.object({
      name: z.string(),
      url: z.string().url(),
    });

    schema.parse({ name, url });
  } catch (error) {
    return APIResponse({
      status: 400,
      data: {
        message: 'Invalid sitemap',
        error: error ? error : 'Unknown error',
      },
    });
  };

  const prisma = new PrismaClient();
  // Get today + 1 day date pure js

  // create a new sitemap in the database
  const sitemap = await prisma.sitemap.create({
    data: {
      name,
      url,
      enabled: true,
      nextRun: new Date(),
      status: 1,
    },
  });


  return APIResponse({
    status: 201,
    data: sitemap,
  });
};

const findAll = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const prisma = new PrismaClient();

  const sitemaps = await prisma.sitemap.findMany();

  return APIResponse({
    status: 200,
    data: sitemaps,
  })  
};

const findById = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

  const selectors = await prisma.selector.findMany({
    where: {
      sitemap_id: Number(id),
    },
    orderBy: {
      order: 'asc',
    },
  });

  return APIResponse({
    status: 200,
    data: {
      ...sitemap,
      selectors,
    }
  })
};

const getSitemapResults = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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

  const results = await prisma.sitemap_result.findMany({
    where: {
      sitemap_id: Number(id),
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return APIResponse({
    status: 200,
    data: results,
  });
  
};

const getSitemapStatus = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
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
      }
    })

  
  }

  return APIResponse({
    status: 200,
    data: {
      status: sitemap.enabled,
    }
  })
};

export { create, findAll, findById, getSitemapResults, getSitemapStatus };
