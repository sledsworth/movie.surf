class ShareButtonElement extends HTMLElement {
	private button: HTMLButtonElement | null = null;
	private slotElement: HTMLSlotElement | null = null;
	private shareData: ShareData | null = null;

	static get observedAttributes() {
		return ["title", "text", "url", "image-url"];
	}

	constructor() {
		super();

		this.handleClick = this.handleClick.bind(this);
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

	async connectedCallback() {
		this.button = document.createElement("button");
		this.button.textContent = "Share";
		this.button.type = "button";
		this.button.addEventListener("click", this.handleClick);
		this.slotElement = document.createElement("slot");
		this.button.appendChild(this.slotElement);
		this.shadowRoot?.appendChild(this.button);

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
