import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import MetarAPI from './metar-api.js';

const metar_endpoint = 'https://avwx.fekke.com/metar/';

const books = [
    {
      title: 'The Awakening',
      author: 'Kate Chopin',
    },
    {
      title: 'City of Glass',
      author: 'Paul Auster',
    },
  ];

// A schema is a collection of type definitions (hence "typeDefs")
// that together define the "shape" of queries that are executed against
// your data.
const typeDefs = `#graphql
  # Comments in GraphQL strings (such as this one) start with the hash (#) symbol.

  # This "Book" type defines the queryable fields for every book in our data source.
  type Book {
    title: String
    author: String
  }

  type Metar {
    raw_text: String!
    station_id: String
    observation_time: String!
    latitude: Float!
    longitude: Float!
    temp_c: Float!
    dewpoint_c: Float!
    wind_dir_degrees: Int!
    wind_speed_kt: Float!
    visibility_statute_mi: Float
    altim_in_hg: Float!
    sea_level_pressure_mb: Float
    flight_category: String
    sky_condition: [SkyCondition!]!
  }

  type SkyCondition {
    sky_cover: String!
    cloud_base_ft_agl: Int
  }

  # The "Query" type is special: it lists all of the available queries that
  # clients can execute, along with the return type for each. In this
  # case, the "books" query returns an array of zero or more Books (defined above).
  type Query {
    books: [Book]
    getMetar(id: String!): [Metar!]!
  }

`;

// Resolvers define how to fetch the types defined in your schema.
// This resolver retrieves books from the "books" array above.
const resolvers = {
    Query: {
      books: () => books,
      getMetar: async (_, { id }, { dataSources }) => {
        return dataSources.metarAPI.getMetar(id);
      },  
    }
  };

  // The ApolloServer constructor requires two parameters: your schema
// definition and your set of resolvers.
const server = new ApolloServer({
    typeDefs,
    resolvers,
  });
  
  // Passing an ApolloServer instance to the `startStandaloneServer` function:
  //  1. creates an Express app
  //  2. installs your ApolloServer instance as middleware
  //  3. prepares your app to handle incoming requests
  const { url } = await startStandaloneServer(server, {
    listen: { port: 4000 },
    context: async () => {
      const { cache } = server;
     return {
       // We create new instances of our data sources with each request,
       // passing in our server's cache.
       dataSources: {
         metarAPI: new MetarAPI({ cache })
       },
     };
   }
  });
  
  console.log(`🚀  Server ready at: ${url}`);
  
  /*
Example metar response

{
"raw_text": "KCRG 120153Z 19009KT 10SM -RA FEW017 BKN070 OVC110 21/20 A2987 RMK AO2 LTG DSNT NE AND E SLP115 P0013 T02110200",
"station_id": "KCRG",
"observation_time": "2023-02-12T01:53:00Z",
"latitude": "30.33",
"longitude": "-81.52",
"temp_c": "21.1",
"dewpoint_c": "20.0",
"wind_dir_degrees": "190",
"wind_speed_kt": "9",
"visibility_statute_mi": "10.0",
"altim_in_hg": "29.870079",
"sea_level_pressure_mb": "1011.5",
"quality_control_flags": {
"auto_station": "TRUE"
},
"wx_string": "-RA",
"sky_condition": [
{
"sky_cover": "FEW",
"cloud_base_ft_agl": "1700"
},
{
"sky_cover": "BKN",
"cloud_base_ft_agl": "7000"
},
{
"sky_cover": "OVC",
"cloud_base_ft_agl": "11000"
}
],
"flight_category": "VFR",
"precip_in": "0.13",
"metar_type": "METAR",
"elevation_m": "12.0"
},
  */