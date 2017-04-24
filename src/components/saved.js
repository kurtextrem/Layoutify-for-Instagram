import { h, render, Component } from 'preact'
import { Router } from 'preact-router'
import Posts from './posts'

export default class Saved extends Posts {
	id = 'saved'
}
