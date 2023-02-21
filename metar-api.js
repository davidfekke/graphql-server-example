import { RESTDataSource } from '@apollo/datasource-rest';

class MetarAPI extends RESTDataSource {
  baseURL = 'https://avwx.fekke.com/';

  async getMetar(id) {
    return this.get(`metar/${encodeURIComponent(id)}`);
  }
}

export default MetarAPI;
