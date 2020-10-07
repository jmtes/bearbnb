import 'core-js/stable';
import 'regenerator-runtime/runtime';

import 'cross-fetch/polyfill';

import jwt from 'jsonwebtoken';

import prisma from '../src/prisma';

import getClient from './utils/getClient';
import seedDatabase, {
  userOne,
  userTwo,
  listingOne,
  listingTwo
} from './utils/seedDatabase';

import { getListing, createListing } from './operations/listing';

describe('User', () => {
  const defaultClient = getClient();

  beforeAll(seedDatabase);

  describe.skip('Queries', () => {
    describe.skip('listing', () => {
      test('Error is thrown if listing does not exist', async () => {
        const variables = { id: 'sklfjdsklf' };

        await expect(
          defaultClient.query({ query: getListing, variables })
        ).rejects.toThrow('Listing not found.');
      });

      test('Expected listing is returned', async () => {
        const variables = { id: listingOne.listing.id };

        const {
          data: { listing }
        } = await defaultClient.query({ query: getListing, variables });

        expect(listing.name).toBe(listingOne.listing.name);
      });

      test('Address is hidden if not authenticated', async () => {
        const variables = { id: listingOne.listing.id };

        const {
          data: { listing }
        } = await defaultClient.query({ query: getListing, variables });

        expect(listing.address).toBe(null);
      });

      test('Address is hidden if authenticated but not owner', async () => {
        const client = getClient(userTwo.jwt);

        const variables = { id: listingOne.listing.id };

        const {
          data: { listing }
        } = await client.query({ query: getListing, variables });

        expect(listing.address).toBe(null);
      });

      test('Address is visible if authenticated and owner', async () => {
        const client = getClient(userOne.jwt);

        const variables = { id: listingOne.listing.id };

        const {
          data: { listing }
        } = await client.query({ query: getListing, variables });

        expect(listing.address).toBe(listingOne.listing.address);
      });

      test('Reservations are hidden if not authenticated', async () => {
        const variables = { id: listingOne.listing.id };

        const {
          data: { listing }
        } = await defaultClient.query({ query: getListing, variables });

        expect(listing.reservations).toBe(null);
      });

      test('Reservations are hidden if authenticated but not owner', async () => {
        const client = getClient(userTwo.jwt);

        const variables = { id: listingOne.listing.id };

        const {
          data: { listing }
        } = await client.query({ query: getListing, variables });

        expect(listing.reservations).toBe(null);
      });

      test('Reservations are visible if authenticated and owner', async () => {
        const client = getClient(userOne.jwt);

        const variables = { id: listingOne.listing.id };

        const {
          data: { listing }
        } = await client.query({ query: getListing, variables });

        expect(listing.reservations).toEqual([]);
      });
    });
  });

  describe('Mutations', () => {
    const defaultData = {
      name: 'Luxury Penthouse',
      desc: 'A penthouse suite with a great view of the skyline',
      address: '905 Brickell Bay Dr Miami Florida',
      latitude: 25.773277,
      longitude: -80.231365,
      beds: 2,
      baths: 2,
      maxGuests: 4,
      price: 462,
      photos: ['https://i.imgur.com/N1WLg.jpeg'],
      amenities: ['KITCHEN', 'AIR_CONDITIONING', 'WIFI']
    };

    describe('createListing', () => {
      // Authentication
      test('Error is thrown if not authenticated', async () => {
        const variables = { data: { ...defaultData } };

        await expect(
          defaultClient.mutate({ mutation: createListing, variables })
        ).rejects.toThrow('Authentication required.');
      });

      test('Error is thrown if user account does not exist', async () => {
        const token = jwt.sign(
          { userId: 'ajsdkasjfls' },
          process.env.JWT_SECRET
        );

        const client = getClient(token);

        const variables = { data: { ...defaultData } };

        await expect(
          client.mutate({ mutation: createListing, variables })
        ).rejects.toThrow('User account does not exist.');
      });

      // Input Validation
      test('Error is thrown if name is too short', async () => {
        const client = getClient(userOne.jwt);

        const variables = { data: { ...defaultData, name: 'L' } };

        await expect(
          client.mutate({ mutation: createListing, variables })
        ).rejects.toThrow('Name must contain 2-32 characters.');
      });

      test('Error is thrown if name is too long', async () => {
        const client = getClient(userOne.jwt);

        const variables = {
          data: { ...defaultData, name: 'Luxury Penthouse!!!!!!!!!!!!!!!!!' }
        };

        await expect(
          client.mutate({ mutation: createListing, variables })
        ).rejects.toThrow('Name must contain 2-32 characters.');
      });

      test('Error is thrown if description is empty', async () => {
        const client = getClient(userOne.jwt);

        const variables = {
          data: { ...defaultData, desc: '' }
        };

        await expect(
          client.mutate({ mutation: createListing, variables })
        ).rejects.toThrow('Description may not be empty.');
      });

      test('Error is thrown if description is too long', async () => {
        const client = getClient(userOne.jwt);

        const variables = {
          data: {
            ...defaultData,
            desc: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Cras vitae congue odio, sed blandit eros. In ac velit varius, facilisis tortor ac, sagittis leo. Morbi urna urna, vestibulum et porttitor eu, congue quis quam. Curabitur dignissim eget nisl vel venenatis. Vestibulum nec vulputate dui. Sed vitae mattis purus. In hac habitasse platea dictumst. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Phasellus commodo diam lectus, non accumsan quam vulputate ac. Fusce enim velit, varius sed lobortis iaculis, vulputate ac mi. 
              
            Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Etiam pharetra est sit amet iaculis dignissim. Curabitur semper a massa quis tristique. Proin velit purus, dapibus non justo vitae, facilisis porta eros. Integer vitae tempor diam. Integer quis velit sit amet velit facilisis posuere sit amet quis quam. Sed sed sollicitudin risus, ac placerat massa. Sed euismod eleifend quam, vitae condimentum ex gravida quis. Suspendisse potenti. Duis gravida, arcu eget commodo maximus, nunc felis semper orci, ac consectetur risus velit ac turpis. 
              
            Aliquam erat volutpat. Donec eu iaculis sapien. Aliquam consectetur ligula in ante rutrum, eu hendrerit nisi tincidunt. Mauris gravida erat libero, ac imperdiet odio volutpat at. Praesent sagittis nisi eu nisl ullamcorper mattis. Duis imperdiet, lorem in porta suscipit, turpis elit condimentum elit, rutrum rutrum orci nisi ut augue. Fusce dapibus odio dolor, quis sollicitudin erat tincidunt sit amet. Mauris malesuada non lacus id suscipit. Donec efficitur maximus metus ut vulputate. Praesent sit amet lacinia odio. Etiam quis iaculis tellus.`
          }
        };

        await expect(
          client.mutate({ mutation: createListing, variables })
        ).rejects.toThrow('Description may not exceed 250 words.');
      });

      test('Error is thrown if address does not start with building number', async () => {
        const client = getClient(userOne.jwt);

        const variables = {
          data: {
            ...defaultData,
            address: 'Columbus Avenue San Francisco CA 94133'
          }
        };

        await expect(
          client.mutate({ mutation: createListing, variables })
        ).rejects.toThrow('Invalid street address.');
      });

      test('Error is thrown if address is nonsensical', async () => {
        const client = getClient(userOne.jwt);

        const variables = {
          data: {
            ...defaultData,
            address: '1020 asfhskdncksdvjncwdio'
          }
        };

        await expect(
          client.mutate({ mutation: createListing, variables })
        ).rejects.toThrow('Invalid street address.');
      });

      test('Error is thrown if photos contains invalid image URL', async () => {
        const client = getClient(userOne.jwt);

        const variables = {
          data: {
            ...defaultData,
            photos: [...defaultData.photos, 'not_a_valid_url']
          }
        };

        await expect(
          client.mutate({ mutation: createListing, variables })
        ).rejects.toThrow('Photos must be valid image URLs');
      });

      test('Error is thrown if photos contains images that are not PNGs or JP(E)Gs', async () => {
        const client = getClient(userOne.jwt);

        const variables = {
          data: {
            ...defaultData,
            photos: [...defaultData.photos, 'me.gif']
          }
        };

        await expect(
          client.mutate({ mutation: createListing, variables })
        ).rejects.toThrow('Photos must be either PNGs or JP(E)Gs.');
      });

      // Input Sanitization

      // DB Changes
      test('New listing appears in the DB', async () => {
        const client = getClient(userOne.jwt);

        const variables = { data: { ...defaultData } };

        const {
          data: {
            createListing: { id }
          }
        } = await client.mutate({ mutation: createListing, variables });

        const newListingExists = await prisma.exists.Listing({ id });
        expect(newListingExists).toBe(true);
      });

      test('New city is created if it does not exist in DB', async () => {
        const client = getClient(userOne.jwt);

        const variables = {
          data: {
            ...defaultData,
            address: '4501 Lindell Blvd St Louis Missouri'
          }
        };

        const cityExistsPrior = await prisma.exists.City({
          name: 'Saint Louis',
          state: 'Missouri',
          country: 'United States of America'
        });
        expect(cityExistsPrior).toBe(false);

        await client.mutate({ mutation: createListing, variables });

        const cityExistsAfter = await prisma.exists.City({
          name: 'Saint Louis',
          state: 'Missouri',
          country: 'United States of America'
        });
        expect(cityExistsAfter).toBe(true);
      });
    });
  });
});