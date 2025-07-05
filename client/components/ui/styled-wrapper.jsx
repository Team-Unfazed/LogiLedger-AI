import React from 'react';
import styled from 'styled-components';

export const StyledWrapper = styled.div`
  .btn {
    width: 100px;
    height: 35px;
    background: linear-gradient(to top, #00154c, #12376e, #23487f);
    color: #fff;
    border-radius: 50px;
    border: none;
    outline: none;
    cursor: pointer;
    position: relative;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    margin-left: 20px;
    /* Debug styles to ensure visibility */
    display: inline-block;
    z-index: 1000;
    font-weight: bold;
  }

  .btn span {
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
    transition: top 0.5s;
    /* Ensure text is visible */
    color: #ffffff;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  .btn-text-one {
    position: absolute;
    width: 100%;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
  }

  .btn-text-two {
    position: absolute;
    width: 100%;
    top: 150%;
    left: 0;
    transform: translateY(-50%);
  }

  .btn:hover .btn-text-one {
    top: -100%;
  }

  .btn:hover .btn-text-two {
    top: 50%;
  }

  /* Add a fallback style in case styled-components doesn't work */
  .btn-fallback {
    width: 100px;
    height: 35px;
    background: linear-gradient(to top, #00154c, #12376e, #23487f);
    color: #fff;
    border-radius: 50px;
    border: none;
    outline: none;
    cursor: pointer;
    position: relative;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    margin-left: 20px;
    display: inline-block;
    z-index: 1000;
    font-weight: bold;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
`; 