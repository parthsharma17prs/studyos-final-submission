import {executeCode} from '../services/api';

export async function runQuizCompiler({code, language, testCases})
{
  const response=await executeCode({code, language, testCases});
  return response.data;
}
