class BrowserStoreElement extends HTMLElement {
	private form: HTMLFormElement | null = null;
	private slotElement: HTMLSlotElement | null = null;
	private abortController: AbortController | null = null;

	constructor() {
		super();

		this.handleSlotChange = this.handleSlotChange.bind(this);

		this.attachShadow({ mode: "open" });
	}

	handleCheckbox(key: string, value: any) {
		const checkboxes = this.form?.querySelectorAll(`[name="${key}"]`);
		if (checkboxes) {
			for (const checkbox of checkboxes) {
				if (Array.isArray(value)) {
					if (value.includes((checkbox as HTMLInputElement).value)) {
						(checkbox as HTMLInputElement).checked = true;
					}
				} else {
					if ((checkbox as HTMLInputElement).value === value) {
						(checkbox as HTMLInputElement).checked = true;
					}
				}
			}
		}
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
						value = value[0];
					}
					formValues = { ...formValues, [key]: value };
				}
				localStorage.setItem(`${this.form?.name}`, JSON.stringify(formValues));
				console.log("formdata", event, formData.getAll("genres"));
			});
		}
	}

	handleRadio(key: string, value: any) {
		const radios = this.form?.querySelectorAll(`[name="${key}"]`);
		if (radios) {
			for (const radio of radios) {
				console.log(radio.value, value);
				if ((radio as HTMLInputElement).value === value) {
					(radio as HTMLInputElement).checked = true;
				}
			}
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
		const checkboxes = this.form?.querySelectorAll(`[type="checkbox"]`) ?? [];
		for (const checkbox of checkboxes) {
			(checkbox as HTMLInputElement).checked = false;
		}
		for (const key in data) {
			const value = data[key];
			const inputType = this.form
				?.querySelector(`[name="${key}"]`)
				?.getAttribute("type");
			switch (inputType) {
				case "checkbox":
					this.handleCheckbox(key, value);
					break;
				case "radio":
					this.handleRadio(key, value);
					break;
				default:
					this.form
						?.querySelector(`[name="${key}"]`)
						?.setAttribute("value", value);
					break;
			}
		}
	}

	handleSubmit(event: Event) {
		// event.preventDefault();
		// console.log(event, this.form, new FormData(this.form as HTMLFormElement));
	}
}

class BrowserStore {
	private storageType: "localStorage" | "sessionStorage";

	constructor(storageType: "localStorage" | "sessionStorage") {
		this.storageType = storageType;
	}
}

customElements.define("browser-store", BrowserStoreElement);
