import {App, MarkdownRenderer, MarkdownView, Modal, Plugin, PluginSettingTab, Setting} from 'obsidian';
import * as AWS from 'aws-sdk';
import * as aliOss from 'ali-oss';

// Remember to rename these classes and interfaces!

type OssType = 'aliyun' | 'aws';
interface OssObjectViewerSettings {
	type: OssType
	bucket?: string;
	region: string;
	accessKeyId: string;
	secretAccessKey: string
}

const DEFAULT_SETTINGS: OssObjectViewerSettings = {
	type: 'aliyun',
	region: '',
	accessKeyId: '',
	secretAccessKey: ''
}

export default class OssObjectViewer extends Plugin {
	settings: OssObjectViewerSettings;

	async onload() {

		await this.loadSettings();

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new OssObjectViewerSettingTab(this.app, this));

		const bucket = this.settings.bucket
		let sdkInstance: aliOss;

		if (this.settings.type === 'aliyun') {
			sdkInstance = new aliOss({
				region: this.settings.region,
				accessKeyId: this.settings.accessKeyId,
				accessKeySecret: this.settings.secretAccessKey
			})
		} else if (this.settings.type === 'aws') {
		}


		this.registerMarkdownCodeBlockProcessor('', (source, el, ctx) => {
			debugger
			const regex = /!\[(.*?)\]\((.*?)\)/g;
			const expiration = 3600; // The expiration time for the presigned URL, in seconds

			const newSource = source.replace(regex, (match, p1, p2) => {
				const presignedUrl = sdkInstance.signatureUrl(`${bucket}/${p2}`,{
					expires : expiration,
				});
				return `![${p1}](${presignedUrl})`;
			});
			debugger

			// el.innerHTML = MarkdownRenderer.renderMarkdown(newSource, ctx);
		});
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class OssObjectViewerSettingTab extends PluginSettingTab {
	plugin: OssObjectViewer;

	constructor(app: App, plugin: OssObjectViewer) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for OssObjectViewer plugin.'});

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your bucket region')
				.setValue(this.plugin.settings.region || '')
				.onChange(async (value) => {
					this.plugin.settings.region = value;
					await this.plugin.saveSettings();
				}))
			.addText(component => component
				.setPlaceholder('Enter you bucket name')
				.setValue(this.plugin.settings.bucket || '')
				.onChange(async (value) => {
					this.plugin.settings.bucket = value;
					return this.plugin.saveSettings()
				}))
			.addText(component => component
				.setPlaceholder('Enter you accessKeyId')
				.setValue(this.plugin.settings.accessKeyId || '')
				.onChange(async (value) => {
					this.plugin.settings.accessKeyId = value;
					return this.plugin.saveSettings()
				}))
			.addText(component => component
				.setPlaceholder('Enter you secretAccessKey')
				.setValue(this.plugin.settings.secretAccessKey || '')
				.onChange(async (value) => {
					this.plugin.settings.secretAccessKey = value;
					return this.plugin.saveSettings()
				}));
	}
}
