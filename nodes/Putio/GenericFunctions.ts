import {
	IExecuteFunctions,
	IHookFunctions,
	ILoadOptionsFunctions,
	IDataObject,
	NodeApiError,
	IHttpRequestOptions,
	IHttpRequestMethods,
} from 'n8n-workflow';

import {
	OptionsWithUri,
} from 'request';

import {
	ICredentialDataDecryptedObject,
	ICredentialTestFunctions,
	INodeCredentialTestResult,
} from 'n8n-workflow';

export async function putioApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
	formData?: IDataObject,
	option: IDataObject = {},
) {
	const options: IDataObject = {
		method,
		url: `https://api.put.io/v2${endpoint}`,
		qs: query,
		body,
		json: true,
	};

	if (formData) {
		options.formData = formData;
		options.json = false;
	}

	if (Object.keys(option).length !== 0) {
		Object.assign(options, option);
	}

	try {
		const response = await this.helpers.requestWithAuthentication.call(this, 'putioApi', options);

		// If this is a download request and we get a 302, return the redirect URL
		if (endpoint.includes('/download') && option.resolveWithFullResponse && response.statusCode === 302) {
			return response.headers.location;
		}

		return response;
	} catch (error) {
		// If this is a download request and we get a 302 in the error
		if (endpoint.includes('/download') && error.statusCode === 302) {
			// Extract the download URL from the HTML response
			const urlMatch = error.message.match(/href="([^"]+)"/);
			if (urlMatch) {
				return urlMatch[1].replace(/&amp;/g, '&');
			}
		}

		throw new NodeApiError(this.getNode(), error);
	}
}

export async function validateCredentials(
	this: ICredentialTestFunctions,
	decryptedCredentials: ICredentialDataDecryptedObject,
): Promise<INodeCredentialTestResult> {
	try {
		const options: IHttpRequestOptions = {
			headers: {
				'Authorization': `Bearer ${decryptedCredentials.accessToken}`,
			},
			method: 'GET',
			url: 'https://api.put.io/v2/account/info',
			json: true,
		};

		await this.helpers.request(options);
		return {
			status: 'OK',
			message: 'Connection successful!',
		};
	} catch (error) {
		return {
			status: 'Error',
			message: 'The credentials are not valid!',
		};
	}
} 