import React from 'react';
import ConverterFilledIcon from "../../../icons/ConverterFilledIcon";
import ParserFilledIcon from "../../../icons/ParserFilledIcon";

export default {
  title: 'Converter',
  icon: <ConverterFilledIcon />,
  actions: {
    index: {
      fields: ['namespace', 'name', 'source_data_type', 'target_data_type', 'discard_events', 'updated_at']
    }
  }
};
