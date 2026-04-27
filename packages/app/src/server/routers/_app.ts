import { z } from 'zod';
import { procedure, router } from '../trpc';

export const appRouter = router({
  hello: procedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query((opts) => {
      return {
        greeting: `hello ${opts.input.text}`,
      };
    }),
  chess: router({
    titled: procedure
      .input(
        z.object({
          days: z.number(),
          title: z.string(),
          countryCode: z.string().default(''),
        })
      )
      .query(() => {
        return {
          leaderboard: [],
          distribution: { rapid: [], blitz: [], bullet: [] },
          overall: {
            rapid: { average: 0, max: 0, min: 0 },
            blitz: { average: 0, max: 0, min: 0 },
            bullet: { average: 0, max: 0, min: 0 },
          },
          countries: [{ country_code: '', country: '', count: 0 }],
          count: {
            total: 0,
            gm: 0,
            im: 0,
            fm: 0,
            cm: 0,
            nm: 0,
            wgm: 0,
            wim: 0,
            wfm: 0,
            wcm: 0,
            wnm: 0,
          },
        };
      }),
  }),
});
// export type definition of API
export type AppRouter = typeof appRouter;
