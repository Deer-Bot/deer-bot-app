import Axios from 'axios';
import ApiError from './api-error';

export default class ApiClient {
  private static endpoint:string = process.env.API_ENDPOINT;
  private static instance = Axios.create({
    baseURL: ApiClient.endpoint,
  });


  public static async get(url: string, data?: {[index: string]: Object}): Promise<any> {
    try {
      const res = await ApiClient.instance.get(url, {
        params: data,
      });

      return res.data;
    } catch (err) {
      if (!err.response) {
        throw new ApiError(`Call to function ${url} responded with error code: ${err.code}`, undefined);
      }

      throw new ApiError(`Call to function ${url} responded with status code: ${err.response.status}`, err.response.status);
    }
  }

  public static async post(url: string, body?: {[index: string]: Object}): Promise<any> {
    try {
      const res = await ApiClient.instance.post(url, body);

      return res.data;
    } catch (err) {
      if (!err.response) {
        throw new ApiError(`Call to function ${url} responded with error code: ${err.code}`, undefined);
      }

      throw new ApiError(`Call to function ${url} responded with status code: ${err.response.status}`, err.response.status);
    }
  }

  public static async delete(url: string, body?: {[index: string]: Object}): Promise<void> {
    try {
      await ApiClient.instance.delete(url, {data: body});
    } catch (err) {
      if (!err.response) {
        throw new ApiError(`Call to function ${url} responded with error code: ${err.code}`, undefined);
      }

      throw new ApiError(`Call to function ${url} responded with status code: ${err.response.status}`, err.response.status);
    }
  }
}
