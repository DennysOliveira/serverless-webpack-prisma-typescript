
import { myLog } from '@libs/log';

const handler = async (event: any) => {  
  myLog('Logged through the shared library!')
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Healthy!',      
    }),
  };
}

export { handler }