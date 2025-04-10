		{
			name: 'Get Files & Folders',
			value: 'getFile',
			description: 'Get a file or folder by ID or path',
			action: 'Get a file or folder',
			routing: {
				request: {
					method: 'GET',
					url: '=/files/{{$parameter.fileId}}',
				},
				output: {
					postReceive: [
						{
							type: 'set',
							properties: {
								value: '={{ { "file": $response.body } }}',
							},
						},
					],
				},
			},
		}, 