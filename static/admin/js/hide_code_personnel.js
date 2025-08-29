document.addEventListener("DOMContentLoaded", function () {
    function toggleCodePersonnel() {
        const roleSelect = document.querySelector("#id_role");
        const codeField = document.querySelector(".form-row.field-code_personnel");

        if (!roleSelect || !codeField) return;

        if (roleSelect.value === "medecin") {
            codeField.style.display = "block";
        } else {
            codeField.style.display = "none";
            const input = codeField.querySelector("input");
            if (input) input.value = "";  // efface si pas médecin
        }
    }

    const roleSelect = document.querySelector("#id_role");
    if (roleSelect) {
        roleSelect.addEventListener("change", toggleCodePersonnel);
        toggleCodePersonnel(); // appel initial
    }
});
