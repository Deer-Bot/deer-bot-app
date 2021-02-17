import Axios from 'axios';
import ApiError from './api-error';

export default class ApiClient {
  private static endpoint:string = process.env.API_ENDPOINT;
  private static instance = Axios.create({
    baseURL: ApiClient.endpoint,
  });


  public static async get(url: string, data?: {[index: string]: Object}): Promise<any> {
    const res = await ApiClient.instance.get(url, {
      params: data,
    });

    if (res.status === 200) {
      return res.data;
    } else {
      throw new ApiError(`API responded with status code: ${res.status}`, res.status);
    }
  }

  public static async post(url: string, body?: {[index: string]: Object}): Promise<any> {
    const res = await ApiClient.instance.post(url, body);

    if (res.status !== 200) {
      throw new ApiError(`API responded with status code: ${res.status}`, res.status);
    }

    return res.data;
  }

  public static async delete(url: string, body?: {[index: string]: Object}): Promise<void> {
    const res = await ApiClient.instance.delete(url, {data: body});

    if (res.status !== 200) {
      throw new ApiError(`API responded with status code: ${res.status}`, res.status);
    }
  }
}
