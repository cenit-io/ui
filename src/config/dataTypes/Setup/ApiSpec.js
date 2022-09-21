import React from 'react';
import ApiSpecsFilledIcon from "../../../icons/ApiSpecsFilledIcon";
import StringCodeControl from "../../../components/StringCodeControl";
import sharedOriginFields from "../../orchestrators/sharedOriginFields";

const fields = ['title', 'url', 'specification'];

export default {
  title: 'API Spec',
  icon: <ApiSpecsFilledIcon />,
  actions: {
    index: {
      fields: ['title', 'url', 'updated_at']
    },
    new: {
      fields,
      seed: {
        specification: "openapi: '3.0.0'\ninfo:\n  version: 0.0.1\n  title: title\n  description: description\n  termsOfService: terms\n  contact:\n    name: name\n    url: http://example\n    email: email@example\n  license:\n    name: MIT\n    url: http://opensource.org/licenses/MIT\npaths:\n  /resource:\n    get:\n     responses:\n      200:\n        description: \"Successful operation\"\n        schema:\n          type: object\n      404:\n        description: \"Resource not found\"\n"
      }
    },
    edit: {
      viewportFields: [...fields, 'origin']
    }
  },
  fields: {
    specification: {
      control: StringCodeControl,
      controlProps: {
        mime: 'text/x-yaml'
      }
    }
  },
  orchestrator: sharedOriginFields(...fields)
};
