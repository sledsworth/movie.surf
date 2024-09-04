class BrowserStoreElement extends HTMLElement {
	private form: HTMLFormElement | null = null;
	private slotElement: HTMLSlotElement | null = null;
	private abortController: AbortController | null = null;

	constructor() {
		super();

		this.handleSlotChange = this.handleSlotChange.bind(this);

		this.attachShadow({ mode: "open" });
	}

	handleSlotChange() {
		this.form = this.querySelector("form");
		console.log("slot change", this.form);
		if (this.form) {
			this.form.addEventListener("submit", this.handleSubmit.bind(this));
			this.form.addEventListener("change", (event: Event) => {
				const formData = new FormData(this.form as HTMLFormElement);
				let formValues = {};
				for (const key of formData.keys()) {
					console.log(key, formData.getAll(key));
					let value = formData.getAll(key);
					if (value.length === 1) {
						// TODO: Fix this
						// value = value[0];
					}
					formValues = { ...formValues, [key]: value };
					localStorage.setItem(
						`${this.form?.name}`,
						JSON.stringify(formValues),
					);
				}
				console.log("formdata", event, formData.getAll("genres"));
			});
		}
	}

	connectedCallback() {
		this.slotElement = document.createElement("slot");
		this.slotElement.addEventListener("slotchange", this.handleSlotChange, {
			signal: this.abortController?.signal,
		});
		this.shadowRoot?.append(this.slotElement);
		this.form = this.querySelector("form");
		const data = JSON.parse(localStorage.getItem(`${this.form?.name}`) ?? "{}");
		// const formData = new FormData(this.form as HTMLFormElement);
		for (const key in data) {
			const value = data[key];
			if (Array.isArray(value)) {
				for (const item of value) {
					console.log("item", item);
					this.form
						?.querySelector(`[name="${key}"][value="${item}"]`)
						?.setAttribute("checked", "");
				}
			} else {
				this.form
					?.querySelector(`[name="${key}"][value="${value}"]`)
					?.setAttribute("checked", "");
			}
		}
	}

	handleSubmit(event: Event) {
		event.preventDefault();
		console.log(event);
	}
}

class BrowserStore {
	private storageType: "localStorage" | "sessionStorage";

	constructor(storageType: "localStorage" | "sessionStorage") {
		this.storageType = storageType;
	}
}

customElements.define("browser-store", BrowserStoreElement);
