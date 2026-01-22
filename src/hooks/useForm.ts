import { useState } from 'react';

const useForm = (initialValues = {}) => {
    const [values, setValues] = useState(initialValues);
    const [errors, setErrors] = useState({});

    const handleChange = (event) => {
        const { name, value } = event.target;
        setValues({
            ...values,
            [name]: value,
        });
    };

    const handleSubmit = (callback) => (event) => {
        event.preventDefault();
        if (validate()) {
            callback(values);
        }
    };

    const validate = () => {
        // Add validation logic here
        const newErrors = {};
        // Example validation
        if (!values.question) {
            newErrors.question = 'Question is required';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    return {
        values,
        errors,
        handleChange,
        handleSubmit,
    };
};

export default useForm;