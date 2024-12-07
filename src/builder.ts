import ValidationPlugin from '@pothos/plugin-validation';
import ScopeAuthPlugin from '@pothos/plugin-scope-auth';
import ErrorsPlugin from '@pothos/plugin-errors';
import SmartSubscriptionsPlugin, {
	subscribeOptionsFromIterator
} from '@pothos/plugin-smart-subscriptions';
import SchemaBuilder from '@pothos/core';
import { Context } from './context';
import { DateTimeResolver } from 'graphql-scalars';
import { pubsub } from './pubsub';
import { GraphQLError } from 'graphql';

export const builder = new SchemaBuilder<{
	Context: Context;
	Scalars: {
		Date: {
			Input: Date;
			Output: Date;
		};
	};
	AuthScopes: {
		loggedIn: boolean;
	};
}>({
	plugins: [
		ScopeAuthPlugin,
		ValidationPlugin,
		ErrorsPlugin,
		SmartSubscriptionsPlugin
	],
	validationOptions: {
		// optionally customize how errors are formatted
		validationError: (zodError, args, context, info) => {
			// the default behavior is to just throw the zod error directly
			return zodError;
		}
	},
	scopeAuth: {
		// Recommended when using subscriptions
		// when this is not set, auth checks are run when event is resolved rather than when the subscription is created
		authorizeOnSubscribe: true,
		authScopes: async (context) => ({
			loggedIn: !!context.oidc?.sub
		}),
		unauthorizedError: (parent, context, info, result) => {
			if (context.oidc?.sub) {
				return new GraphQLError(
					'You do not have permission to access this resource.',
					{
						extensions: {
							code: 'PERMISSION_DENIED'
						}
					}
				);
			} else {
				return new GraphQLError(
					'You must be logged in to access this resource.',
					{
						extensions: {
							code: 'AUTHENTICATION_REQUIRED'
						}
					}
				);
			}
		}
	},
	smartSubscriptions: {
		...subscribeOptionsFromIterator((name) =>
			pubsub.asyncIterableIterator(name)
		)
	}
});

builder.addScalarType('Date', DateTimeResolver, {});

builder.objectType(Error, {
	name: 'Error',
	fields: (t) => ({
		message: t.exposeString('message')
	})
});
