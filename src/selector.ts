import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { SelectorTypes } from './constants';
import { APIResponse } from '@libs/response';

interface DBSelector {
  id: number;
  type_id: number;
  sitemap_id: number;
  order: number;
  multiple: boolean;
  data: string;
  name?: string;
}

interface Selector {
  type_id: number;
  name?: string;
  data: string;
  multiple: boolean;
}

type IUpdateOrCreateDTO = Selector[];

const updateOrCreate = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { id } = event.pathParameters as { id: string };
  if(!event.body) throw new Error('No body provided');
  const selectors = JSON.parse(event.body) as IUpdateOrCreateDTO;

  // Validate the selectors
  const selectorSchema = z.object({
    type_id: z.number().int().min(1).max(4),
    name: z.string().max(50).optional(),
    data: z.string().max(255),
    multiple: z.boolean(),
  });

  const selectorSchemaArray = z.array(selectorSchema);

  try {
    selectorSchemaArray.parse(selectors);
  } catch (error) {
    return APIResponse({
      status: 400,
      data: {
        message: 'Invalid selectors',
        error: error ? error : 'Unknown error',
      },
    })
  }

  const prisma = new PrismaClient();

  const sitemap = await prisma.sitemap.findUnique({
    where: {
      id: parseInt(id),
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

  // Find existing selectors for the given sitemap
  const selector = await prisma.selector.findMany({
    where: {
      sitemap_id: parseInt(id),
    },
  });

  // Delete existing selectors
  if (selector) {
    await prisma.selector.deleteMany({
      where: {
        sitemap_id: parseInt(id),
      },
    });
  }

  // Build the selectors to be created
  // Get order from iteration
  const selectorsToCreate = selectors.map((selector) => ({
    ...selector,
    order: selectors.indexOf(selector),
    sitemap_id: parseInt(id),
  }));

  // Create the new selectors
  const createdSelector = await prisma.selector.createMany({
    data: selectorsToCreate,
  });

  return APIResponse({
    status: 200,
    data: {
      message: 'Selectors updated for the given sitemap',
      selector: createdSelector,
    },    
  })
};

export { updateOrCreate };
