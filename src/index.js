addEventListener('fetch', (event) => {
	event.respondWith(handleRequest(event.request));
});



function getDisplayName(namespace) {
	const displayNames = {
		'jonasjones': 'Homepage (jonasjones.dev)',
		'wiki-jonasjones-dev': 'Jonas_Jones Wiki (wiki.jonasjones.dev)',
		'j-onasjones-github-io': 'Old Homepage (j.onasjones.github.io)',
		'lastlovedsyncify': 'lastlovedsyncify (previews only)',
		'kcomebacks': 'K-Pop Comebacks (kcomebacks.jonasjones.dev)',
		'sveltemarkdownwiki': 'Svelte Markdown Wiki TEMPLATE (sveltemarkdownwiki.jonasjones.dev)',
		'blog-jonasjones-dev': 'Blog (blog.jonasjones.dev)',
		'jonasjones-docs': 'Jonas_Jones Docs (docs.jonasjones.dev)',
		'jonasjonesstudios-com': 'Jonas_Jones Studios (jonasjonesstudios.com)',
	};
	//check if the namespace is in the displayNames object. if not, return the namespace
	return displayNames[namespace] || namespace;
}

async function getPages() {
	const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects`;
	const response = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      		'Content-Type': 'application/json',
		},
	});
	const data = await response.json();
	return data.result;
}

async function getBuilds(namespace) {
	const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/pages/projects/${namespace}/deployments`;
	const response = await fetch(url, {
		headers: {
			'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
	  		'Content-Type': 'application/json',
		},
	});
	const data = await response.json();
	return data.result;
}

function getPagesNamesfromData(data) {
	let pages = [];
	for (let i = 0; i < data.length; i++) {
		pages.push({
			name: data[i].name
		});
	}
	return pages;
}

function getBuildsNamesfromData(data) {
	let builds = [];
	console.log(JSON.stringify(data));
	for (let i = 0; i < data.length; i++) {
		builds.push({
			url: data[i].url,
			created_on: data[i].created_on,
			environment: data[i].environment,
			short_id: data[i].short_id,
			branch: data[i].deployment_trigger.metadata.branch,
			commit_message: data[i].deployment_trigger.metadata.commit_message,
		});
	}
	return builds;
}

function style() {
	return `
		<style>
			body {
				font-family: sans-serif;
			}
			table {
				border-collapse: collapse;
			}
			td, th {
				border: 1px solid #000;
				padding: 0.5rem;
			}
		</style>
	`;
}

async function rootPageConstructor() {
	const pages = await getPagesNamesfromData(await getPages());

	let html = `
		<html>
			<head>
				<title>Pages Builds Index</title>
			</head>
			<body>
				<h1>Pages Builds Index</h1>
				<p>Find all the builds of my Cloudflare Pages here.</p>
				<ul>
	`;

	for (let i = 0; i < pages.length; i++) {
		html += `<li><a href="/${pages[i].name}">${getDisplayName(pages[i].name)}</a></li>`;
	}

	html += `
				</ul>
			</body>
		</html>
	`;
	html += style();

	return html;
}

async function buildsPageConstructor(namespace) {
	const builds = await getBuildsNamesfromData(await getBuilds(namespace));
	const displayName = getDisplayName(namespace);

	let html = `
		<html>
			<head>
				<title>Pages Builds Index</title>
			</head>
			<body>
				<h1>Pages Builds Index</h1>
				<h2>${displayName}:</h2>
				<table>
					<tr>
						<th>ID</th>
						<th>Environment</th>
						<th>Date</th>
						<th>URL</th>
						<th>Branch</th>
						<th>Commit Message</th>
					</tr>
	`;

	for (let i = 0; i < builds.length; i++) {
		html += `<tr><td>${builds[i].short_id}</td><td>${builds[i].environment}</td><td>${builds[i].created_on}</td><td><a href="${builds[i].url}">${builds[i].url}</a></td><td>${builds[i].branch}</td><td>${builds[i].commit_message}</td></tr>`;
	}

	html += `
				</table>
			</body>
		</html>
	`;

	html += style();

	return html;
}


async function handleRequest(request) {
	console.log(CLOUDFLARE_ACCOUNT_ID)
	const { pathname } = new URL(request.url);
	if (pathname === '/') {
		return new Response(await rootPageConstructor(), {
			headers: {
				'content-type': 'text/html;charset=UTF-8',
			},
		});
	}
	const path = pathname.split('/');
	// if the first path is in the getPagesfromData() array, then
	//return new Response(JSON.stringify(await getPages()));
	if (path.length === 2) {
		const pages = await getPagesNamesfromData(await getPages());
		for (let i = 0; i < pages.length; i++) {
			if (pages[i].name === path[1]) {
				return new Response(await buildsPageConstructor(path[1]), {
					headers: {
						'content-type': 'text/html;charset=UTF-8',
					},
				});
			}
		}
	}
}