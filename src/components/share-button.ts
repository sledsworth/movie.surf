class ShareButtonElement extends HTMLElement {
	private button?: HTMLButtonElement | null = null;
	private slotElement: HTMLSlotElement | null = null;
	private shareData: ShareData | null = null;

	static get observedAttributes() {
		return ["title", "text", "url", "image-url"];
	}

	constructor() {
		super();

		this.handleClick = this.handleClick.bind(this);
		this.handleSlotChange = this.handleSlotChange.bind(this);
		this.attachShadow({ mode: "open" });
	}

	handleClick() {
		if (this.shareData) {
			navigator.share(this.shareData);
		}
	}

	urlToFiles(url?: string | null): Promise<File[]> {
		if (!url) {
			return Promise.resolve([]);
		}
		return fetch(url)
			.then((response) => response.blob())
			.then((blob) => {
				return [new File([blob], url)];
			});
	}

	handleSlotChange(event: Event) {
		console.log(event, this.slotElement);
		this.button = this.slotElement?.assignedElements()[0] as HTMLButtonElement;
		this.button.addEventListener("click", this.handleClick);
	}

	async connectedCallback() {
		this.slotElement = document.createElement("slot");
		this.shadowRoot?.appendChild(this.slotElement);
		console.log(this.slotElement);
		this.slotElement.addEventListener("slotchange", this.handleSlotChange);
		const imageUrl = this.getAttribute("image-url");

		this.shareData = {
			title: this.getAttribute("title") || "",
			text: this.getAttribute("text") || "",
			url: this.getAttribute("url") || "",
			files: await this.urlToFiles(imageUrl),
		};
	}

	attributeChangedCallback(name: string, oldValue: string, newValue: string) {
		if (name === "image-url") {
			this.urlToFiles(newValue).then((files) => {
				this.shareData = {
					...(this.shareData ?? {}),
					files,
				};
			});
		} else {
			this.shareData = {
				...(this.shareData ?? {}),
				[name]: newValue,
			};
		}
	}
}

customElements.define("share-button", ShareButtonElement);
