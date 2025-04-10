import {
	ICredentialType,
	NodePropertyTypes,
} from 'n8n-workflow';

export class PutioApi implements ICredentialType {
	name = 'putioApi';
	displayName = 'Put.io API';
	documentationUrl = 'https://api.put.io/v2/docs/';
	properties = [
		{
			displayName: 'OAuth Token',
			name: 'accessToken',
			type: 'string' as NodePropertyTypes,
			default: '',
			description: 'The OAuth token for Put.io API. You can get this from your Put.io account settings.',
		},
	];
} 